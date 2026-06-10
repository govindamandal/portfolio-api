const mongoose = require('mongoose')

const { Schema } = mongoose

function model(name, schema, collection) {
  return mongoose.models[name] || mongoose.model(name, schema, collection)
}

const baseOptions = {
  timestamps: true,
  versionKey: false
}

const Profile = model('Profile', new Schema({
  name: String,
  title: String,
  summary: String,
  location: String,
  email: String,
  phone: String,
  linkedInUrl: String,
  githubUrl: String,
  resumeUrl: String,
  avatarUrl: String,
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'profile')

const Service = model('Service', new Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  icon: String,
  highlights: [String],
  technologies: [String],
  displayOrder: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'services')

const Experience = model('Experience', new Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  location: String,
  startDate: String,
  endDate: String,
  currentlyWorking: { type: Boolean, default: false },
  description: String,
  responsibilities: [String],
  technologies: [String],
  companyUrl: String,
  logo: String,
  displayOrder: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'experiences')

const Project = model('Project', new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, index: true, unique: true },
  company: String,
  client: String,
  description: String,
  yourRole: String,
  techStack: [String],
  liveUrl: String,
  githubUrl: String,
  image: String,
  gallery: [String],
  startDate: String,
  endDate: String,
  featured: { type: Boolean, default: false },
  status: { type: String, default: 'published', enum: ['draft', 'published', 'archived'] },
  isPublic: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, baseOptions), 'projects')

const Skill = model('Skill', new Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Backend', 'Frontend', 'Database', 'Messaging & Streaming', 'Cloud', 'Observability & Tools', 'AI Tools', 'Other'],
    default: 'Other'
  },
  proficiency: { type: Number, min: 1, max: 10, default: 5 },
  icon: String,
  displayOrder: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'skills')

const Certification = model('Certification', new Schema({
  title: { type: String, required: true },
  issuer: String,
  issuedAt: String,
  expiresAt: String,
  credentialId: String,
  credentialUrl: String,
  description: String,
  imageUrl: String,
  displayOrder: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'certifications')

const Course = model('Course', new Schema({
  title: { type: String, required: true },
  provider: String,
  completedAt: String,
  courseUrl: String,
  certificateUrl: String,
  description: String,
  skills: [String],
  displayOrder: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'courses')

const Testimonial = model('Testimonial', new Schema({
  name: { type: String, required: true },
  role: String,
  company: String,
  quote: { type: String, required: true },
  avatarUrl: String,
  displayOrder: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'testimonials')

const ContactMessage = model('ContactMessage', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'new', enum: ['new', 'read', 'archived'] }
}, baseOptions), 'contactMessages')

const Resume = model('Resume', new Schema({
  title: String,
  fileUrl: { type: String, required: true },
  version: String,
  isPrimary: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'resume')

const SiteSetting = model('SiteSetting', new Schema({
  key: { type: String, default: 'default', index: true },
  headline: String,
  subheadline: String,
  availability: String,
  metaTitle: String,
  metaDescription: String,
  ogImage: String,
  isPublic: { type: Boolean, default: true }
}, baseOptions), 'siteSettings')

const User = model('User', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: String,
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['admin'] },
  isActive: { type: Boolean, default: true }
}, baseOptions), 'users')

const Asset = model('Asset', new Schema({
  key: String,
  publicUrl: String,
  fileName: String,
  contentType: String,
  size: Number,
  source: { type: String, default: 'r2' }
}, baseOptions), 'assets')

const collectionModels = {
  profile: Profile,
  services: Service,
  experiences: Experience,
  projects: Project,
  skills: Skill,
  certifications: Certification,
  courses: Course,
  testimonials: Testimonial,
  contactMessages: ContactMessage,
  resume: Resume,
  siteSettings: SiteSetting,
  assets: Asset
}

module.exports = {
  Asset,
  Certification,
  ContactMessage,
  Course,
  Experience,
  Profile,
  Project,
  Resume,
  Service,
  SiteSetting,
  Skill,
  Testimonial,
  User,
  collectionModels
}
