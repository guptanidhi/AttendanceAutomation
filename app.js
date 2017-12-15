let fs = require('fs');
let lineReader = require('linereader');

let csvWriter = require('csv-write-stream');

let attendanceSheetPath = './cts-w1/attendance/';

let attendanceSheetsArray = ['29-Nov', '1-Dec', '4-Dec'];

function getMasterList(sheet, callback){
	let masterEmailIds = [];
	sheet.on('error', function(error) {
		callback(error);
		masterSheet.close();
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

	attendanceSheet.on('error', function (err) {
	  console.log(err);
	  attendanceSheet.close();
	});

	attendanceSheet.on('line', function (lineno, line) {
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
		callback(attendedList, registeredButNotAttended);
	  console.log("Attendance sheet Complete.");
	});
}

getMasterList(new lineReader('./cts-w1/master.csv'), function(masterList){
	// Temporary Master list get appended which will get appended by all attended sheet
	let mastList = masterList;
	// Output sheet header
	let header = ['EmailId'];
	// Complete object with sheets key name
	let completeArr = {};
	// Iterage over all attenda
	attendanceSheetsArray.forEach((sheet, index) => {
		// Output sheet header push with sheets name i.e attendance date
		header.push(sheet);
		// line by line read of attendance sheet
		getAttendiesList(new lineReader(attendanceSheetPath+sheet+'.csv'), function(attendedList, registeredButNotAttended) {
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

			// Temporary Master list updated for output file
			mastList = uniqueList;
			
			// Temporary array for each sheet with emailId and attendance status
			let arr = [];
			// Iteration for all users
			uniqueList.forEach((item) => {
				let obj = {
					email: item
				};

				if(suspiciousUsers.indexOf(item) != -1){
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
			// Complete object key is name of sheet i.e. Attendance date assigned array
			completeArr[sheet] = (arr);

			// If iterated last sheet then write into file
			if((attendanceSheetsArray.length-1) == index){
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

	let writer = csvWriter({ headers: header});
	writer.pipe(fs.createWriteStream('output.csv'));	
	
	uniqueList.forEach((emailId) => {
		let firstColumn = isUserAvailable(completeArr[header[1]], emailId);
		let	firstColumnStatus = (firstColumn.length > 0) ? firstColumn[0].status: "";

		let secondColumn = isUserAvailable(completeArr[header[2]], emailId);
		let secondColumnStatus = (secondColumn.length > 0) ? secondColumn[0].status:"";

		let thirdColumn = isUserAvailable(completeArr[header[3]], emailId);
		let	thirdColumnStatus = (thirdColumn.length > 0) ? thirdColumn[0].status: "";

		// Write into the file EmailId, Date wise attendance Status
		writer.write([emailId, firstColumnStatus, secondColumnStatus, thirdColumnStatus]);
	})		
	writer.end();
}