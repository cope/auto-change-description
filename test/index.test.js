const _ = require("lodash");
const expect = require("chai").expect;

const AutoChangeDescription = require("../index");

let tests = [
	{
		before: {a: "a"},
		after: [1],
		response: "Comparing arrays with non-arrays is not allowed."
	}, {
		before: {a: "a"},
		after: {a: "b"},
		response: "Modified {a} from (a) to (b)."
	}, {
		before: ["a"],
		after: ["b"],
		response: "Changed  from ([\"a\"]) to ([\"b\"])."
	}, {
		before: {
			name: "my object",
			puppy: "sexy",
			description: "it's an object!",
			details: {
				it: "has",
				an: "array",
				with: ["a", "few", "elements"]
			}
		},
		after: {
			name: "updated object",
			sexy: "puppy",
			description: "it's an object!",
			details: {
				it: "has",
				an: "array",
				with: ["a", "few", "more", "elements", {than: "before"}]
			}
		},
		response: "Deleted {puppy} with value (sexy). " +
		"Created {sexy} with value (puppy). Modified {name} from (my object) to (updated object). " +
		"Modified {details.with} from ([\"a\",\"few\",\"elements\"]) to ([\"a\",\"few\",\"more\",\"elements\",{\"than\":\"before\"}])."
	}
];

describe("AutoChangeDescription tests", function () {
	it("AutoChangeDescription should exist", function () {
		expect(AutoChangeDescription).to.exist;
	});

	it("AutoChangeDescription.describe should exist", function () {
		expect(AutoChangeDescription.describe).to.exist;
	});

	describe("AutoChangeDescription.describe tests", function () {
		_.forEach(tests, (test) => {
			it("describe should return  " + test.response, function () {
				let response = AutoChangeDescription.describe(test.before, test.after);
				response = _.trim(_.join(response, " "));
				expect(response).to.be.equal(test.response);
			});
		});
	});

});
