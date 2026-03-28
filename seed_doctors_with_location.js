const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

// Sample doctor data with locations in Kathmandu
const sampleDoctors = [
  {
    username: 'dr-rajesh-sharma',
    email: 'rajesh.sharma@hospital.com',
    password: 'password123',
    phone: '+977-9841234567',
    role: 'doctor'
  },
  {
    username: 'dr-anita-gurung',
    email: 'anita.gurung@clinic.com',
    password: 'password123',
    phone: '+977-9842345678',
    role: 'doctor'
  },
  {
    username: 'dr-peter-thapa',
    email: 'peter.thapa@medical.com',
    password: 'password123',
    phone: '+977-9843456789',
    role: 'doctor'
  },
  {
    username: 'dr-sita-karki',
    email: 'sita.karki@health.com',
    password: 'password123',
    phone: '+977-9844567890',
    role: 'doctor'
  },
  {
    username: 'dr-bikram-magar',
    email: 'bikram.magar@care.com',
    password: 'password123',
    phone: '+977-9845678901',
    role: 'doctor'
  }
];

const doctorProfiles = [
  {
    specialization: 'Cardiology',
    licenseNumber: 'NMC-2023-001',
    qualifications: ['MBBS', 'MD - Cardiology', 'DM - Cardiology'],
    experience: 15,
    bio: 'Experienced cardiologist specializing in interventional cardiology and heart diseases.',
    consultationFee: 1500,
    clinic: {
      name: 'Kathmandu Heart Hospital',
      address: 'Maharajgunj, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      phone: '+977-1-4412345',
      email: 'info@hearthospital.com'
    },
    location: {
      type: 'Point',
      coordinates: [85.3240, 27.7172] // Kathmandu city center
    }
  },
  {
    specialization: 'Pediatrics',
    licenseNumber: 'NMC-2023-002',
    qualifications: ['MBBS', 'MD - Pediatrics'],
    experience: 8,
    bio: 'Dedicated pediatrician with expertise in child healthcare and vaccinations.',
    consultationFee: 800,
    clinic: {
      name: 'Kids Care Clinic',
      address: 'Patan, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44700',
      phone: '+977-1-5523456',
      email: 'info@kidscare.com'
    },
    location: {
      type: 'Point',
      coordinates: [85.3228, 27.6783] // Patan area
    }
  },
  {
    specialization: 'Orthopedics',
    licenseNumber: 'NMC-2023-003',
    qualifications: ['MBBS', 'MS - Orthopedics'],
    experience: 12,
    bio: 'Orthopedic surgeon specializing in joint replacement and trauma surgery.',
    consultationFee: 1200,
    clinic: {
      name: 'Bone & Joint Center',
      address: 'Bansbari, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44601',
      phone: '+977-1-6634567',
      email: 'info@bonejoint.com'
    },
    location: {
      type: 'Point',
      coordinates: [85.3402, 27.7389] // Bansbari area
    }
  },
  {
    specialization: 'Dermatology',
    licenseNumber: 'NMC-2023-004',
    qualifications: ['MBBS', 'MD - Dermatology'],
    experience: 6,
    bio: 'Dermatologist with expertise in skin treatments and cosmetic procedures.',
    consultationFee: 1000,
    clinic: {
      name: 'Skin Care Center',
      address: 'Thamel, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44618',
      phone: '+977-1-7745678',
      email: 'info@skincare.com'
    },
    location: {
      type: 'Point',
      coordinates: [85.3235, 27.7087] // Thamel area
    }
  },
  {
    specialization: 'General Practice',
    licenseNumber: 'NMC-2023-005',
    qualifications: ['MBBS', 'MD - General Medicine'],
    experience: 10,
    bio: 'General practitioner providing comprehensive healthcare for all ages.',
    consultationFee: 600,
    clinic: {
      name: 'Family Health Clinic',
      address: 'New Baneshwor, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44610',
      phone: '+977-1-8856789',
      email: 'info@familyhealth.com'
    },
    location: {
      type: 'Point',
      coordinates: [85.3380, 27.6927] // New Baneshwor area
    }
  }
];

async function seedDoctorsWithLocation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    // Clear existing doctors (optional - comment out if you want to keep existing data)
    console.log('Clearing existing doctor users and profiles...');
    await User.deleteMany({ role: 'doctor' });
    await Doctor.deleteMany({});

    // Create users and doctor profiles
    for (let i = 0; i < sampleDoctors.length; i++) {
      const userData = sampleDoctors[i];
      const profileData = doctorProfiles[i];

      // Create user
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);

      // Create doctor profile
      const doctor = new Doctor({
        userId: user._id,
        ...profileData,
        isVerified: true, // Auto-verify for testing
        verifiedAt: new Date()
      });
      await doctor.save();
      console.log(`Created doctor profile for: ${userData.username}`);
    }

    console.log('Successfully seeded doctors with location data!');
    
    // Display created doctors
    const createdDoctors = await Doctor.find({}).populate('userId', 'username email');
    console.log('\nCreated Doctors:');
    createdDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. Dr. ${doctor.userId.username} - ${doctor.specialization}`);
      console.log(`   Clinic: ${doctor.clinic.name}`);
      console.log(`   Address: ${doctor.clinic.address}`);
      console.log(`   Location: ${doctor.location.coordinates[1]}, ${doctor.location.coordinates[0]}`);
      console.log(`   Fee: Rs. ${doctor.consultationFee}\n`);
    });

  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedDoctorsWithLocation();
