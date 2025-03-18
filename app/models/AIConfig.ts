import mongoose from "mongoose";

const aiConfigSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    primary: {
        type: String,
        required: true
    }, 
    secondary: {
        type: String,
        required: false
    },
    mainPrompt: {
        type: String
    },
    formatPrompt: {
        type: String
    }
});

// Add a pre-save hook to ensure only one default configuration exists
aiConfigSchema.pre('save', async function(next) {
    if (this.isDefault) {
        // If this config is being set as default, unset all others
        await mongoose.model('AIConfig').updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

const AIConfig = mongoose.models.AIConfig || mongoose.model('AIConfig', aiConfigSchema);

export default AIConfig;