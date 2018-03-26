var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var url = "mongodb://localhost:27017/mydb";

var Q = require('q');

var _dbConnection = null;

function cleanup() {
	console.log("oops...")
	if(_dbConnection)
		_dbConnection.close();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function DBconnect(url) {
	var deferred = Q.defer();
	if(_dbConnection === null) {
		MongoClient.connect(url, function(err, db) {
			if(err)
				deferred.reject(err);
			else {
				_dbConnection = db;
				deferred.resolve(_dbConnection);
			}
		});
	} else {
		deferred.resolve(_dbConnection);
	}
	return deferred.promise;
}

function DBfind(db, collection, queryObj, fields) {
	// console.log("\nDBfind");
	// console.log(collection);
	// console.log(queryObj);
	// console.log(fields);
	var deferred = Q.defer();
	db.collection(collection).find(queryObj, fields).toArray(function(err, result) {
		if(err)
			deferred.reject(err);
		else
			deferred.resolve(result);
	});
	return deferred.promise;
}

function DBinsertOne(db, collection, data) {
	var deferred = Q.defer();
	db.collection(collection).insertOne(data, function(err, result) {
		if(err)
			deferred.reject(err);
		else
			deferred.resolve(result);
	});
	return deferred.promise;
}

function DBdelete(db, collection, queryObj) {
	var deferred = Q.defer();
	db.collection(collection).deleteMany(queryObj, function(err, result) {
		if(err)
			deferred.reject(err);
		else
			deferred.resolve(result);
	});
	return deferred.promise;
}

function find(doctor, txid) {
	var deferred = Q.defer();
	DBconnect(url)
	.then(
		(db) => {
			DBfind(db, "index", { doctor: doctor, txid: txid })
			.then(
				(result) => {
					if(result === null) {
						deferred.reject(new Error("find : index not exists"));
					} else if(result.length != 1) {
						deferred.reject(new Error("find : more than one index"));
					} else {
						DBfind(db, "data", { _id: new mongo.ObjectID(result[0].index) }, { _id:false})
						.then(
							(result) => { deferred.resolve(result); },
							(reason) => { deferred.reject(new Error("find : can not find data")); }
						);
					}
				},
				(reason) => {
					deferred.reject(new Error("find can not find index : " + reason));
				}
			);
		},
		(reason) => {
			deferred.reject(new Error("find DBconnect fails : " + reason));
		}
	);
	return deferred.promise;
}

function deleteIndex(txid) {
	var deferred = Q.defer();
	DBconnect(url)
	.then(
		(db) => {
			DBdelete(db, "index", { txid: txid })
			.then(
				(reseult) => { deferred.resolve(result); },
				(reason) => { deferred.reject(new Error("deleteIndex DBdelete fails : " + reason)); }
			);
		},
		(reason) => {
			deferred.reject(new Error("deleteIndex DBconnect fails"));
		}
	);
	return deferred.promise;
}

function insertIndex(doctor, txid, patient) {
	var deferred = Q.defer();
	DBconnect(url)
	.then(
		(db) => {
			DBfind(db, "data", {patient: patient})
			.then(
				(result) => {
					if(result === null) {
						deferred.reject(new Error("insertIndex can not find patient record"));
					} else if(result.length != 1) {
						deferred.reject(new Error("insertIndex patient has more than one record"));
					} else {
						var recordId = result[0]._id;
						var index = {doctor: doctor, txid: txid, index: recordId};
						DBinsertOne(db, "index", index)
						.then(
							(result) => { deferred.resolve(result); },
							(reason) => { deferred.reject(new Error("insertIndex insertOne fails : " + reason)); }
						);
					}
				},
				(reason) => {
					deferred.reject(new Error("insertIndex find fails : " + reason));
				}
			);
		},
		(reason) => {
			deferred.reject(new Error("insertIndex DBconnect fails : " + reason));
		}
	);
	return deferred.promise;
}

function insertData(data) {
	var deferred = Q.defer();
	DBconnect(url)
	.then(
		(db) => {
			DBinsertOne(db, "data", data)
			.then(
				(result) => { deferred.resolve(result); },
				(reason) => { deferred.reject(new Error("insertData DBinsertOne fails : " + reason)); }
			);
		},
		(reason) => {
			deferred.reject(new Error("insertData DBconnect fails : " + reason));
		}
	);
	return deferred.promise;
}

// var data = {did: "123",
// 			pid: "1",
// 			rid: "6843541684324",
// 			inspection: "xuechanggui",
// 			result: "jieguo",
// 			analysis: "yidianfenxi",
// 			prescription: "fufanggancaopian",
// 			files: ["f1", "f2"]
// 		};
// console.log(data);
// insertData(data).then((result)=>{console.log("insert success", result);}, (err)=>{});


exports.find = find;
exports.insertIndex = insertIndex;
exports.insertData = insertData;
