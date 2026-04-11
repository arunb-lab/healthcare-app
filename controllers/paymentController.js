const axios = require('axios');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const KHALTI_BASE = 'https://a.khalti.com/api/v2/epayment';

exports.initiateKhalti = async (req, res) => {
  try {
    const { doctorId, additionalDoctorIds, appointmentDate, appointmentTime, reason, notes, isEmergency } = req.body;
    const patientId = req.user.id;

    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({ message: 'Doctor ID, date, time and reason are required' });
    }

    // Validate main doctor
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (!doctor.isVerified) return res.status(400).json({ message: 'Doctor is not verified' });
    
    // Validate additional doctors
    const additionalDoctorsData = [];
    if (additionalDoctorIds && Array.isArray(additionalDoctorIds)) {
      for (const id of additionalDoctorIds) {
        const doc = await Doctor.findById(id).populate('userId');
        if (!doc) return res.status(404).json({ message: `Additional doctor ${id} not found` });
        if (!doc.isVerified) return res.status(400).json({ message: `Doctor ${doc.userId.username} is not verified` });
        additionalDoctorsData.push({ userId: doc.userId._id, doctorProfileId: doc._id });
      }
    }

    const allDoctorUserIds = [doctor.userId._id, ...additionalDoctorsData.map(d => d.userId)];
    
    if (allDoctorUserIds.some(id => id.toString() === patientId)) {
      return res.status(400).json({ message: 'Cannot book appointment with yourself' });
    }

    // Appointment must be in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({ message: 'Appointment date and time must be in the future' });
    }

    const appointmentDateObj = new Date(appointmentDate);
    appointmentDateObj.setHours(0, 0, 0, 0);

    // Conflict check for ALL doctors
    const conflict = await Appointment.findOne({
      $or: [
        { doctorId: { $in: allDoctorUserIds } },
        { 'additionalDoctors.userId': { $in: allDoctorUserIds } }
      ],
      appointmentDate: appointmentDateObj,
      appointmentTime,
      status: { $in: ['payment_pending', 'pending', 'approved'] },
    });

    if (conflict) {
      return res.status(400).json({ message: 'One or more doctors are already booked for this time slot.' });
    }

    // Patient conflict check
    const patientConflict = await Appointment.findOne({
      patientId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      status: { $in: ['payment_pending', 'pending', 'approved'] },
    });
    if (patientConflict) {
      return res.status(400).json({ message: 'You already have an appointment at this time.' });
    }

    // Amount in paisa (Rs × 100)
    const amount = Math.round((doctor.consultationFee || 0) * 100);
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/return`;

    // Save appointment as payment_pending to reserve the slot
    const appointment = new Appointment({
      patientId,
      doctorId: doctor.userId._id,
      doctorProfileId: doctor._id,
      additionalDoctors: additionalDoctorsData,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      reason,
      notes: notes || '',
      isEmergency: !!isEmergency,
      consultationFee: doctor.consultationFee,
      status: 'payment_pending',
      payment: { status: 'pending', provider: 'khalti', amount },
    });
    await appointment.save();

    const purchaseName = `Appointment with Dr. ${doctor.userId.username}${additionalDoctorsData.length > 0 ? ` & ${additionalDoctorsData.length} more` : ''}`;

    if (process.env.KHALTI_TEST === 'true') {
      const fakePidx = `test_${appointment._id}`;
      appointment.payment.pidx = fakePidx;
      await appointment.save();

      const mockUrl =
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/mock-khalti` +
        `?pidx=${fakePidx}` +
        `&amount=${amount}` +
        `&name=${encodeURIComponent(purchaseName)}`;
      return res.json({
        pidx: fakePidx,
        payment_url: mockUrl,
        appointmentId: appointment._id,
        _testMode: true,
      });
    }
    
    try {
      const khaltiRes = await axios.post(
        `${KHALTI_BASE}/initiate/`,
        {
          return_url: returnUrl,
          website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
          amount,
          purchase_order_id: appointment._id.toString(),
          purchase_order_name: purchaseName,
          customer_info: {
            name: req.user.username,
            email: req.user.email,
            phone: req.user.phone || '',
          },
        },
        { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' } }
      );

      appointment.payment.pidx = khaltiRes.data.pidx;
      await appointment.save();

      return res.json({
        pidx: khaltiRes.data.pidx,
        payment_url: khaltiRes.data.payment_url,
        appointmentId: appointment._id,
      });
    } catch (khaltiErr) {
      // Free the reserved slot if Khalti call fails
      await Appointment.findByIdAndDelete(appointment._id);
      console.error('Khalti initiate error:', khaltiErr.response?.data || khaltiErr.message);
      return res.status(502).json({
        message: 'Failed to initiate payment with Khalti',
        error: khaltiErr.response?.data || khaltiErr.message,
      });
    }
  } catch (err) {
    console.error('initiateKhalti error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyKhalti = async (req, res) => {
  const { pidx } = req.body;

  if (!pidx) {
    return res.status(400).json({ message: 'pidx is required' });
  }

  if (pidx.startsWith('test_') || process.env.KHALTI_TEST === 'true') {
    try {

      let appointment = await Appointment.findOne({ 'payment.pidx': pidx })
        .populate('doctorId', 'username email')
        .populate('patientId', 'username email');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found (test mode)' });
      }

      if (appointment.status !== 'payment_pending') {
        return res.json({
          message: 'Payment verified (test mode). Appointment booked successfully!',
          appointment: {
            id: appointment._id,
            status: appointment.status,
            doctor: { name: appointment.doctorId?.username || 'Doctor' },
            patient: { name: appointment.patientId?.username || 'Patient' },
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            payment: { status: appointment.payment?.status, transactionId: appointment.payment?.transactionId, amount: appointment.payment?.amount },
          },
        });
      }

      // Confirm the appointment
      appointment = await Appointment.findOneAndUpdate(
        { 'payment.pidx': pidx, status: 'payment_pending' },
        {
          status: 'pending',
          'payment.status': 'completed',
          'payment.transactionId': `TEST_TXN_${Date.now()}`,
          updatedAt: new Date(),
        },
        { new: true }
      )
        .populate('doctorId', 'username email')
        .populate('patientId', 'username email');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found (test mode)' });
      }

      return res.json({
        message: 'Payment verified (test mode). Appointment booked successfully!',
        appointment: {
          id: appointment._id,
          status: appointment.status,
          doctor: { name: appointment.doctorId?.username || 'Doctor' },
          patient: { name: appointment.patientId?.username || 'Patient' },
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          payment: { status: appointment.payment?.status, transactionId: appointment.payment?.transactionId, amount: appointment.payment?.amount },
        },
      });
    } catch (testErr) {
      console.error('verifyKhalti test mode error:', testErr.message);
      return res.status(500).json({ message: 'Payment verification failed (test mode)', error: testErr.message });
    }
  }
 
  try {
    const khaltiRes = await axios.post(
      `${KHALTI_BASE}/lookup/`,
      { pidx },
      { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    const { status, transaction_id, total_amount } = khaltiRes.data;

    if (status !== 'Completed') {
      // Free the slot — mark appointment as cancelled
      await Appointment.findOneAndUpdate(
        { 'payment.pidx': pidx, status: 'payment_pending' },
        { status: 'cancelled', 'payment.status': 'failed', cancellationReason: `Payment ${status}`, updatedAt: new Date() }
      );
      return res.status(402).json({ message: `Payment not completed. Khalti status: ${status}` });
    }

    // Confirm the appointment
    const appointment = await Appointment.findOneAndUpdate(
      { 'payment.pidx': pidx, status: 'payment_pending' },
      {
        status: 'pending',
        'payment.status': 'completed',
        'payment.transactionId': transaction_id,
        'payment.raw': khaltiRes.data,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('doctorId', 'username email')
      .populate('patientId', 'username email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or already processed' });
    }

    return res.json({
      message: 'Payment verified. Appointment booked successfully!',
      appointment: {
        id: appointment._id,
        status: appointment.status,
        doctor: { name: appointment.doctorId.username },
        patient: { name: appointment.patientId.username },
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        payment: { status: appointment.payment.status, transactionId: transaction_id, amount: total_amount },
      },
    });
  } catch (err) {
    console.error('Khalti verify error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Payment verification failed', error: err.response?.data || err.message });
  }
};
