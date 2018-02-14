const _ = require('lodash');
const expect = require("chai").expect;

const AutoChangeDescription = require("../index");

describe("AutoChangeDescription tests", function () {
	it('AutoChangeDescription should exist', function () {
		expect(AutoChangeDescription).to.exist;
	});

	it('AutoChangeDescription.get should exist', function () {
		expect(AutoChangeDescription.describe).to.exist;
	});

});
