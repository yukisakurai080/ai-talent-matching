const mongoose = require('mongoose');

const interviewTrackingSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  talentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Talent',
    required: false // 応募者情報は別途保存されている場合があるため
  },
  applicantName: {
    type: String,
    required: true
  },
  applicantEmail: {
    type: String,
    required: true
  },
  positionTitle: {
    type: String,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['online', 'in-person'],
    required: true
  },
  platform: {
    type: String, // zoom, google-meet, teams, in-person
    required: true
  },
  scheduledDates: [{
    type: String // 面接候補日時
  }],
  confirmedDate: {
    type: String // 確定した面接日時
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'hired', 'not_hired', 'cancelled'],
    default: 'scheduled'
  },
  hiringReportedAt: {
    type: Date
  },
  hiringReportDetails: {
    startDate: String, // 入社予定日
    salary: Number, // 提示年収
    notes: String // その他メモ
  },
  followUpSentDates: [{
    type: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時にupdatedAtを自動更新
interviewTrackingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InterviewTracking', interviewTrackingSchema);
