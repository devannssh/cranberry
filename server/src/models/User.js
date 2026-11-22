import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    // Chosen once after signing up (see Onboarding). Unique + sparse, so accounts made before usernames existed still work.
    username: { type: String, lowercase: true, trim: true, minlength: 3, maxlength: 20, unique: true, sparse: true },
    avatar: { type: Number, min: 0, max: 7, default: 0 },
    profileStyle: { type: String, enum: ['light', 'gradient'], default: 'light' },
  },
  { timestamps: true },
)

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  username: u.username ?? null, // null = hasn't picked one yet
  avatar: u.avatar ?? 0,
  profileStyle: u.profileStyle ?? 'light',
  createdAt: u.createdAt,
})
export default mongoose.model('User', schema)
