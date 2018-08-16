#!/usr/bin/env node

"use strict";

const _ = require("lodash");
const deepDiff = require("deep-diff").diff;
const deepEqual = require("deep-equal");

const convertValue = (value) => value ? _.isString(value) ? value : JSON.stringify(value) : "-";

const createNewRoot = (root = "") => _.size(root) > 0 ? root += "." : root + "";

function convertDifference(difference, path) {
	if ("N" !== difference.kind) difference.before = difference.lhs;
	if ("D" !== difference.kind) difference.after = difference.rhs;

	if ("D" === difference.kind) return {path, type: "delete", value: convertValue(difference.before)};
	else if ("N" === difference.kind) return {path, type: "create", value: convertValue(difference.after)};
	else if ("E" === difference.kind) return {path, type: "modify", from: convertValue(difference.before), to: convertValue(difference.after)};

	return difference;
}

const sortDifference = (difference) => convertDifference(difference, _.join(difference.path, "."));

function processArrays(beforeArrays, afterArrays, root) {
	let results = [];
	let newRoot = createNewRoot(root);

	let deleted = _.keys(_.omit(beforeArrays, _.keys(afterArrays)));
	let created = _.keys(_.omit(afterArrays, _.keys(beforeArrays)));

	_.forEach(deleted, (item) => results.push({path: newRoot + item, type: "delete", value: convertValue(beforeArrays[item])}));
	_.forEach(created, (item) => results.push({path: newRoot + item, type: "create", value: convertValue(afterArrays[item])}));

	beforeArrays = _.omit(beforeArrays, deleted);
	_.forEach(beforeArrays, (beforeArray, key) => {
		let afterArray = afterArrays[key];
		if (afterArray && !deepEqual(beforeArray, afterArray)) results.push({path: newRoot + key, type: "modify", from: convertValue(beforeArray), to: convertValue(afterArray)});
	});
	return results;
}

function extractObjects(parent) {
	let myObjects = {};
	_.forEach(parent, (value, key) => {
		if (_.isPlainObject(value)) myObjects[key] = value;
	});
	return myObjects;
}

function extractArrays(parent) {
	let myArrays = {};
	_.forEach(parent, (value, key) => {
		if (_.isArray(value)) myArrays[key] = value;
	});
	return myArrays;
}

function processObjects(beforeObjects, afterObjects, root) {
	let results = [];
	let newRoot = createNewRoot(root);

	let deleted = _.keys(_.omit(beforeObjects, _.keys(afterObjects)));
	let created = _.keys(_.omit(afterObjects, _.keys(beforeObjects)));

	_.forEach(deleted, (item) => results.push({path: item, type: "delete", value: convertValue(beforeObjects[item])}));
	_.forEach(created, (item) => results.push({path: item, type: "create", value: convertValue(afterObjects[item])}));

	beforeObjects = _.omit(beforeObjects, deleted);
	_.forEach(beforeObjects, (beforeObject, key) => {
		let afterObject = afterObjects[key];
		if (afterObject && !deepEqual(beforeObject, afterObject)) results = _.concat(results, process(beforeObject, afterObject, newRoot + key));
	});
	return results;
}

function process(before, after, root = "") {
	if (deepEqual(before, after)) return ["No changes."];

	if ((_.isArray(before) && !_.isArray(after)) || (_.isArray(after) && !_.isArray(before))) return ["Comparing arrays with non-arrays is not allowed."];

	if (_.isArray(before) && _.isArray(after)) return ["Changed  from (" + convertValue(before) + ") to (" + convertValue(after) + ")."];

	let beforeArrays = extractArrays(before);
	before = _.omit(before, _.keys(beforeArrays));

	let afterArrays = extractArrays(after);
	after = _.omit(after, _.keys(afterArrays));

	let arrResults = processArrays(beforeArrays, afterArrays, root);

	let beforeObjects = extractObjects(before);
	before = _.omit(before, _.keys(beforeObjects));

	let afterObjects = extractObjects(after);
	after = _.omit(after, _.keys(afterObjects));

	let objResults = processObjects(beforeObjects, afterObjects, root);

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
