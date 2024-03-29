"use strict";

require("json-circular-stringify");

const _ = require("lodash");

const deepDiff = require("deep-diff").diff;
const deepEqual = require("deep-equal");

const convertValue = (value) => value ? _.isString(value) ? value : JSON.stringify(value) : "-";

const createNewRoot = (root = "") => _.size(root) > 0 ? root += "." : root + "";

function convertDifference(difference, path) {
	if ("N" !== difference.kind) difference.before = difference.lhs;
	if ("D" !== difference.kind) difference.after = difference.rhs;

	let rets = {
		D: {path, type: "delete", value: convertValue(difference.before)},
		N: {path, type: "create", value: convertValue(difference.after)},
		E: {path, type: "modify", from: convertValue(difference.before), to: convertValue(difference.after)},
	};
	let ret = _.get(rets, difference.kind);

	return ret ? ret : difference;
}

const sortDifference = (difference) => convertDifference(difference, _.join(difference.path, "."));

function processArrays(beforeArrays, afterArrays, root) {
	let results = [];
	let newRoot = createNewRoot(root);

	let deleted = _.keys(_.omit(beforeArrays, _.keys(afterArrays)));
	let created = _.keys(_.omit(afterArrays, _.keys(beforeArrays)));

	_.forEach(deleted, (item) => results.push({path: newRoot + item, type: "delete", value: convertValue(_.get(beforeArrays, item))}));
	_.forEach(created, (item) => results.push({path: newRoot + item, type: "create", value: convertValue(_.get(afterArrays, item))}));

	beforeArrays = _.omit(beforeArrays, deleted);
	_.forEach(beforeArrays, (beforeArray, key) => {
		let afterArray = _.get(afterArrays, key);
		if (afterArray && !deepEqual(beforeArray, afterArray)) results.push({path: newRoot + key, type: "modify", from: convertValue(beforeArray), to: convertValue(afterArray)});
	});
	return results;
}

function extractObjects(parent) {
	let myObjects = {};
	_.forEach(parent, (value, key) => {
		if (_.isPlainObject(value)) _.set(myObjects, key, value);
	});
	return myObjects;
}

function extractArrays(parent) {
	let myArrays = {};
	_.forEach(parent, (value, key) => {
		if (_.isArray(value)) _.set(myArrays, key, value);
	});
	return myArrays;
}

const nonMatchingArrays = (b, a) => (_.isArray(b) && !_.isArray(a)) || (_.isArray(a) && !_.isArray(b));
const bothArrays = (b, a) => _.isArray(b) && _.isArray(a);
const noNeedToCompare = (b, a) => {
	if (deepEqual(b, a)) return ["No changes."];
	if (nonMatchingArrays(b, a)) return ["Comparing arrays with non-arrays is not allowed."];
	if (bothArrays(b, a)) return ["Changed from (" + convertValue(b) + ") to (" + convertValue(a) + ")."];
	return null;
};

function processObjects(beforeObjects, afterObjects, root, processMethod) {
	let results = [];
	let newRoot = createNewRoot(root);

	let deleted = _.keys(_.omit(beforeObjects, _.keys(afterObjects)));
	let created = _.keys(_.omit(afterObjects, _.keys(beforeObjects)));

	_.forEach(deleted, (item) => results.push({path: item, type: "delete", value: convertValue(_.get(beforeObjects, item))}));
	_.forEach(created, (item) => results.push({path: item, type: "create", value: convertValue(_.get(afterObjects, item))}));

	beforeObjects = _.omit(beforeObjects, deleted);
	_.forEach(beforeObjects, (beforeObject, key) => {
		let afterObject = _.get(afterObjects, key);
		if (afterObject && !deepEqual(beforeObject, afterObject)) results = _.concat(results, processMethod(beforeObject, afterObject, newRoot + key));
	});
	return results;
}

function process(before, after, root = "") {
	let noNeed = noNeedToCompare(before, after);
	if (noNeed) return noNeed;

	let beforeArrays = extractArrays(before);
	before = _.omit(before, _.keys(beforeArrays));

	let afterArrays = extractArrays(after);
	after = _.omit(after, _.keys(afterArrays));

	let arrResults = processArrays(beforeArrays, afterArrays, root);

	let beforeObjects = extractObjects(before);
	before = _.omit(before, _.keys(beforeObjects));

	let afterObjects = extractObjects(after);
	after = _.omit(after, _.keys(afterObjects));

	let objResults = processObjects(beforeObjects, afterObjects, root, process);

	// Process the rest
	let results = [];
	let differences = deepDiff(before, after);
	_.forEach(differences, (difference) => results.push(sortDifference(difference)));

	return _.concat(results, arrResults, objResults);
}

function describe(before, after, root) {
	let descriptions = process(before, after, root);

	let errors = _.filter(descriptions, _.isString);
	if (_.size(errors) > 0) return errors;

	let deletions = _.filter(descriptions, ["type", "delete"]);
	let creates = _.filter(descriptions, ["type", "create"]);
	let edits = _.filter(descriptions, ["type", "modify"]);

	let results = [];
	_.forEach(deletions, (difference) => results.push("Deleted {" + difference.path + "} with value (" + difference.value + ")."));
	_.forEach(creates, (difference) => results.push("Created {" + difference.path + "} with value (" + difference.value + ")."));
	_.forEach(edits, (difference) => results.push("Modified {" + difference.path + "} from (" + difference.from + ") to (" + difference.to + ")."));
	return results;
}

module.exports = {
	describe
};
