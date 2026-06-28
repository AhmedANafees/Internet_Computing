'use strict';

const repo = require('../repositories/planRepository');
const registrationService = require('./registrationService');
const ApiError = require('../utils/ApiError');

function listForStudent(studentId) {
  return repo.findByStudent(studentId);
}

async function getForStudent(planId, studentId) {
  const plan = await repo.findById(planId);
  if (!plan || plan.student_id !== studentId) {
    throw ApiError.notFound('Plan not found');
  }
  plan.items = await repo.findItems(planId);
  return plan;
}

async function createForStudent(studentId, planName) {
  const plan = await repo.create({ student_id: studentId, plan_name: planName || 'Active Plan' });
  plan.items = [];
  return plan;
}

async function addItem(planId, studentId, crn) {
  await getForStudent(planId, studentId);
  try {
    await repo.addItem(planId, crn);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('Section is already in this plan');
    }
    throw err;
  }
  return getForStudent(planId, studentId);
}

async function removeItem(planId, studentId, crn) {
  await getForStudent(planId, studentId);
  const removed = await repo.removeItem(planId, crn);
  if (!removed) {
    throw ApiError.notFound('Section is not in this plan');
  }
  return getForStudent(planId, studentId);
}

async function submit(planId, studentId) {
  await getForStudent(planId, studentId);
  return registrationService.registerPlan(studentId, planId);
}

module.exports = {
  listForStudent,
  getForStudent,
  createForStudent,
  addItem,
  removeItem,
  submit,
};
