let fs = require('fs');
let lineReader = require('linereader');
let csvWriter = require('csv-write-stream');
let date = require('date-and-time');

// Attendance sheet folder path
let attendanceSheetPath = './attendance/';

function getMasterList(sheet, callback){
	let masterEmailIds = [];
	sheet.on('error', function(error) {
		callback(error);
		sheet.close();
	});

	sheet.on('line', function(lineNo, line) {
		let lineArr = line.split(",");
		if(lineArr[7] == 1)
			masterEmailIds.push(lineArr[3].toLowerCase());
	})

	sheet.on('end', function(){
		callback(masterEmailIds);
		console.log("Master sheet Complete.");
	})
}

function getAttendiesList(attendanceSheet, callback){
	let attendedList = [];
	let registeredButNotAttended = [];
	let attendanceDate;

	attendanceSheet.on('error', function (err) {
	  console.log(err);
	  attendanceSheet.close();
	});

	attendanceSheet.on('line', function (lineno, line) {
		if(lineno == 5){
			let dateRowArray = line.split(',');
			attendanceDate = date.format(new Date(dateRowArray[1]), 'DD/MMM/YY');
		}
	  if (lineno >= 9) {
	  	let lineArr = line.split(',');
	  	if(lineArr[0] == "Yes"){
	  		attendedList.push(lineArr[3].toLowerCase());
	  	}else{
	  		registeredButNotAttended.push(lineArr[3].toLowerCase());
	  	}
	  }
	});

	attendanceSheet.on('end', function () {
		callback(attendanceDate, attendedList, registeredButNotAttended);
	  console.log("Attendance sheet Complete.");
	});
}

getMasterList(new lineReader('master.csv'), function(masterList){
	// Temporary Master list get appended which will get appended by all attended sheet
	let mastList = masterList;
	// Output sheet header
	let header = ['EmailId'];
	// Complete object with sheets key name
	let completeArr = {};
	// Iterage over all attenda
	// attendanceSheetsArray.forEach((sheet, index) => {
	fs.readdirSync(attendanceSheetPath).forEach((file, index, fileLength) => {
		// line by line read of attendance sheet
		getAttendiesList(new lineReader(attendanceSheetPath+file), function(attendanceDate, attendedList, registeredButNotAttended) {
			// Output sheet header push with attendance date
			header.push(attendanceDate);
			// Combined all attendies who attended and registered but not attended
			let attendanceObj = [...attendedList, ...registeredButNotAttended];
			// Suspicious Users which are in attendance list but not in master list
			let suspiciousUsers = attendanceObj.filter(function(obj) { return masterList.indexOf(obj) == -1; });
			// Cpmbined list of master and attendies
			let combinedList = [...mastList, ...attendanceObj];

			// Make combinedList with unique removed repeated users
			let uniqueList = combinedList.filter(function(email, index, array){
				return array.indexOf(email) == index;		
			});

			// Mentors EmailIds
			let mentorsList = uniqueList.filter(function(email, index, array){
				return email.includes('@stackroute.in');		
			});

			// Temporary Master list updated for output file
			mastList = uniqueList;
			
			// Temporary array for each sheet with emailId and attendance status
			let arr = [];
			// Iteration for all users
			uniqueList.forEach((item) => {
				let obj = {
					email: item
				};
				if(mentorsList.indexOf(item) != -1){
					// Mentors marked as "Mentor"
					obj.status = 'Mentor';
				}else if(suspiciousUsers.indexOf(item) != -1){
					// Suspicious User attendance marked as "Suspicious"
					obj.status = 'Suspicious';
				}else if(attendedList.indexOf(item) != -1){
					// Attended User attendance marked as "Present"
					obj.status = 'Present';
				}else if(registeredButNotAttended.indexOf(item) != -1){
					// Registered User attendance marked as "Absent"
					obj.status = 'Absent';
				}else {
					// Unregistered User attendance marked as "Unregistered"
					obj.status = 'Unregistered';
				}
				// Pushing object to array
				arr.push(obj);
			})
			// Complete object key is Attendance date assigned array
			completeArr[attendanceDate] = (arr);

			// If iterated last sheet then write into file
			if((fileLength.length-1) == index){
				// Write file with heading, users unique list and complete attendies with attendacne status
				writeFile(header, uniqueList, completeArr);
			}
		})
	})
})

// Is User Available in sheet array
function isUserAvailable(array, emailId){
	return array.filter((obj) => {
		return obj.email === emailId;
	})
}

function writeFile(header, uniqueList, completeArr){
	
	fs.exists('./output.csv', function(exists) {
		// To delete output file if it exist
	  if(exists) {
	    fs.unlink('./output.csv');
	  }

		// Create output file with headers
		let writer = csvWriter({ headers: header});
		writer.pipe(fs.createWriteStream('output.csv'));

		// Get attendate date array
		let allAttendanceSheetArr = Object.keys(completeArr);
		
		// Iterate over all emailIds in uniqueList
		uniqueList.forEach((emailId) => {
			let attendanceStatus = [];

			// Iterate over all attendanceDate
			allAttendanceSheetArr.forEach((attendanceSheet) => {
				let column = isUserAvailable(completeArr[attendanceSheet], emailId);
				let	columnStatus = (column.length > 0) ? column[0].status: "";
				attendanceStatus.push(columnStatus);
			})

			// Write into the file EmailId, Date wise attendance Status
			writer.write([emailId, ...attendanceStatus]);
		})		
		writer.end();
	});
}