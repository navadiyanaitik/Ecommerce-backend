// create document
const create = (model, data) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.create(data);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// update single document
const updateOne = (model, filter, data, options = { new: true }) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.findOneAndUpdate(filter, data, options).lean();
      console.log("🚀 ~ newPromise ~ result:", result);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// delete single document
const deleteOne = (model, filter, option = { new: true }) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.findOneAndDelete(filter, option).lean();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// update multiple documents

const updateMany = (model, filter, data) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.updateMany(filter, data);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// delete multiple documents

const deleteMany = (model, filter) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.deleteMany(filter);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// find one document

const findOne = (model, filter = {}, option = {}) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.findOne(filter, option).lean();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

// find multiple document

const findMany = (model, filter = {}, option = {}) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.find(filter, option).sort({ createdAt: -1 }).lean();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

const count = (model, filter) =>
  new Promise((resolve, reject) => {
    try {
      const result = model.countDocuments(filter);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });

module.exports = {
  create,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  findOne,
  findMany,
  count,
};
