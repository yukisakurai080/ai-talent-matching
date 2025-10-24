const express = require('express');
const router = express.Router();
const InterviewTracking = require('../models/InterviewTracking');

// 面接トラッキングレコードを作成
router.post('/', async (req, res) => {
  try {
    const {
      companyId,
      talentId,
      applicantName,
      applicantEmail,
      positionTitle,
      interviewType,
      platform,
      scheduledDates
    } = req.body;

    const tracking = new InterviewTracking({
      companyId,
      talentId,
      applicantName,
      applicantEmail,
      positionTitle,
      interviewType,
      platform,
      scheduledDates,
      status: 'scheduled'
    });

    await tracking.save();

    res.status(201).json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Error creating interview tracking:', error);
    res.status(500).json({
      success: false,
      message: '面接トラッキングの作成に失敗しました'
    });
  }
});

// 企業の面接トラッキング一覧を取得
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const trackings = await InterviewTracking.find({ companyId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      trackings
    });
  } catch (error) {
    console.error('Error fetching interview trackings:', error);
    res.status(500).json({
      success: false,
      message: '面接トラッキングの取得に失敗しました'
    });
  }
});

// 採用報告を登録
router.post('/:trackingId/report-hiring', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { startDate, salary, notes } = req.body;

    const tracking = await InterviewTracking.findById(trackingId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'トラッキングレコードが見つかりません'
      });
    }

    tracking.status = 'hired';
    tracking.hiringReportedAt = new Date();
    tracking.hiringReportDetails = {
      startDate,
      salary,
      notes
    };

    await tracking.save();

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Error reporting hiring:', error);
    res.status(500).json({
      success: false,
      message: '採用報告の登録に失敗しました'
    });
  }
});

// 不採用報告を登録
router.post('/:trackingId/report-not-hired', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const tracking = await InterviewTracking.findById(trackingId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'トラッキングレコードが見つかりません'
      });
    }

    tracking.status = 'not_hired';
    tracking.hiringReportedAt = new Date();

    await tracking.save();

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Error reporting not hired:', error);
    res.status(500).json({
      success: false,
      message: '不採用報告の登録に失敗しました'
    });
  }
});

// 未報告の面接を取得（リマインダー用）
router.get('/company/:companyId/unreported', async (req, res) => {
  try {
    const { companyId } = req.params;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 2週間以上前にスケジュールされ、まだ報告されていない面接
    const unreportedTrackings = await InterviewTracking.find({
      companyId,
      status: { $in: ['scheduled', 'completed'] },
      createdAt: { $lt: twoWeeksAgo }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      trackings: unreportedTrackings,
      count: unreportedTrackings.length
    });
  } catch (error) {
    console.error('Error fetching unreported trackings:', error);
    res.status(500).json({
      success: false,
      message: '未報告面接の取得に失敗しました'
    });
  }
});

module.exports = router;
