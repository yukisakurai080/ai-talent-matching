const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['IT・通信', '建設', '製造', '医療', '介護', '外食・飲食', '物流', '小売', '金融', '教育', 'その他']
  },
  companySize: {
    type: String,
    enum: ['1-10名', '11-50名', '51-100名', '101-300名', '301-1000名', '1001名以上']
  },
  established: {
    type: String
  },
  capital: {
    type: String
  },
  representativeName: {
    type: String
  },
  headquarters: {
    type: String,
    required: true
  },
  businessDescription: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  positionTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  requiredSkills: {
    type: String,
    required: true
  },
  preferredSkills: {
    type: String
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['正社員', '契約社員', '派遣社員', 'パート・アルバイト', '業務委託']
  },
  salaryMin: {
    type: Number,
    required: true
  },
  salaryMax: {
    type: Number,
    required: true
  },
  workLocation: {
    type: String,
    required: true
  },
  workHours: {
    type: String,
    required: true
  },
  holidays: {
    type: String,
    required: true
  },
  benefits: {
    type: String
  },
  selectionProcess: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Company', companySchema);
