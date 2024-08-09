import mongoose from "mongoose";


const aiConfigSchema = new mongoose.Schema({
    primary: {
        type: String,
        required: true
    }, 
    secondary: {
        type: String,
        required: true
    },
    mainPrompt: {
        type: String
    },
    formatPrompt: {
        type: String
    }
});

const AIConfig = mongoose.models.AIConfig || mongoose.model('AIConfig', aiConfigSchema);

export default AIConfig;