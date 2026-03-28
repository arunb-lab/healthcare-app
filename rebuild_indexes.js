const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

async function rebuildIndexes() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        // Drop existing indexes on Doctor collection
        console.log('Dropping existing indexes...');
        await Doctor.collection.dropIndexes();
        
        // Recreate indexes
        console.log('Recreating indexes...');
        await Doctor.createIndexes();
        
        // Verify indexes
        const indexes = await Doctor.collection.getIndexes();
        console.log('Current indexes:');
        if (indexes && indexes.forEach) {
            indexes.forEach((index, i) => {
                console.log(`${i + 1}.`, JSON.stringify(index.key));
            });
        } else {
            console.log('No indexes found or getIndexes() not available');
        }

        console.log('✅ Indexes rebuilt successfully!');
        
    } catch (error) {
        console.error('Error rebuilding indexes:', error);
    } finally {
        await mongoose.disconnect();
    }
}

rebuildIndexes();
