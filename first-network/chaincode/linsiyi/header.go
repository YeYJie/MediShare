package main


type FileUploadArgs struct {
	UploadType		string

	FileName		string
	FileSize		string
	FileChecksum	string

	Uploader		string
	UploadTime 		string
	UploaderSig		string
	UploaderPKC		string

	Entry			string
	EntryFormat		string

	Department		string
	DepartmentSig	string
	DepartmentPKC	string
}

func (t *FileUploadArgs) GetUploaderSigContent() string {
	return ""
}

func (t *FileUploadArgs) GetDepartmentSigContent() string {
	return ""
}


type FileMetaData struct {
	FileId 				string
	NeedAuthorization	bool
	FileVersion			string
	ChaincodeTime		string

	FileName			string
	FileSize			string
	FileChecksum		string

	Uploader			string
	UploadTime 			string
	UploaderSig			string
	UploaderPKC			string

	Entry				string
	EntryFormat			string

	Department			string
	DepartmentSig		string
	DepartmentPKC		string
}

func BuildFileMetaData(fileId string, needAuthorization bool, fileVersion string,
 		chaincodeTime string, fileUploadArgs *FileUploadArgs) FileMetaData {

	fileMetaData := FileMetaData{
		FileId 				: fileId,
		NeedAuthorization	: needAuthorization,
		FileVersion			: fileVersion,
		ChaincodeTime		: chaincodeTime,

		FileName			: fileUploadArgs.FileName,
		FileSize			: fileUploadArgs.FileSize,
		FileChecksum		: fileUploadArgs.FileChecksum,

		Uploader			: fileUploadArgs.Uploader,
		UploadTime 			: fileUploadArgs.UploadTime,
		UploaderSig			: fileUploadArgs.UploaderSig,
		UploaderPKC			: fileUploadArgs.UploaderPKC,

		Entry				: fileUploadArgs.Entry,
		EntryFormat			: fileUploadArgs.EntryFormat,

		Department			: fileUploadArgs.Department,
		DepartmentSig		: fileUploadArgs.DepartmentSig,
		DepartmentPKC		: fileUploadArgs.DepartmentPKC,
	}
	return fileMetaData
}

type FileRequestArgs struct {
	FileId							string
	RequestLauncher					string
	RequestLauncherDepartment		string
	RequestLauncherDepartmentProf	string
	DepartmentPKC					string
	RequestTime						string
	RequestLauncherSig				string
	RequestLauncherPKC				string
}

func (t *FileRequestArgs) GetRequestLauncherSigContent() string {
	return ""
}

func (t *FileRequestArgs) GetDepartmentProfContent() string {
	return ""
}

type FileRequestReply struct {
	FileName			string
	FileVersion			string
	FileSize			string
	FileChecksum		string
	Uploader			string
	Department			string
	Entry				string
	EntryFormat			string
}

func BuildFileRequestReply(meta *FileMetaData) FileRequestReply {
	fileRequestReply := FileRequestReply{
		FileName		:meta.FileName,
		FileVersion		:meta.FileVersion,
		FileSize		:meta.FileSize,
		FileChecksum	:meta.FileChecksum,
		Uploader		:meta.Uploader,
		Department		:meta.Department,
		Entry			:meta.Entry,
		EntryFormat		:meta.EntryFormat,
	}
	return fileRequestReply
}


type AccessControlRequest struct {
	TxId 						string
	FileId 						string
	FileName 					string
	FileVersion 				string
	RequestLauncher 			string
	RequestLauncherDepartment 	string
	RequestLauncherPKC			string
}

type AccessControlReply struct {
	TxId 						string
	FileId 						string
	Success 					bool
	RequestLauncher 			string
	RequestLauncherDepartment 	string
	FileEntry 					string
	FileEntryFormat 			string
	CacheControl 				string
	FileDepartmentSig 			string
	FileDepartmentPKC			string
}

func (t *AccessControlReply) GetFileDepartmentSigContent() string {
	return ""
}

type FileRequestRecord struct {
	TxId 							string
	FileId 							string
	Success 						bool
	RequestLauncher 				string
	RequestLauncherDepartment 		string
	RequestLauncherDepartmentProf	string
	RequestLauncherDepartmentPKC 	string
	RequestTime						string
	RequestLauncherSig				string
	RequestLauncherPKC				string
	FileEntry 						string
	FileEntryFormat 				string
	CacheControl 					string
	FileDepartmentSig 				string
	FileDepartmentPKC				string
}

func BuildFileRequestRecord(fileRequestArgs *FileRequestArgs,
							accessControlReply *AccessControlReply) FileRequestRecord {
	fileRequestRecord := FileRequestRecord{
		TxId 							: accessControlReply.TxId,
		FileId 							: accessControlReply.FileId,
		Success 						: accessControlReply.Success,
		RequestLauncher 				: fileRequestArgs.RequestLauncher,
		RequestLauncherDepartment 		: fileRequestArgs.RequestLauncherDepartment,
		RequestLauncherDepartmentProf	: fileRequestArgs.RequestLauncherDepartmentProf,
		RequestLauncherDepartmentPKC 	: fileRequestArgs.DepartmentPKC,
		RequestTime						: fileRequestArgs.RequestTime,
		RequestLauncherSig				: fileRequestArgs.RequestLauncherSig,
		RequestLauncherPKC				: fileRequestArgs.RequestLauncherPKC,
		FileEntry 						: accessControlReply.FileEntry,
		FileEntryFormat 				: accessControlReply.FileEntryFormat,
		CacheControl 					: accessControlReply.CacheControl,
		FileDepartmentSig 				: accessControlReply.FileDepartmentSig,
		FileDepartmentPKC				: accessControlReply.FileDepartmentPKC,
	}
	return fileRequestRecord
}

type FileQueryArgs struct {
	QuertLauncher			string
	FileName				string
	Department				string
	Uploader				string
	Begin 					string
	End 					string
	QuertLauncherSig		string
	QueryLauncherPKC		string
}

type FileMetaDataForQueryUse struct {
	FileId 				string
	NeedAuthorization	bool
	FileVersion			string
	FileName			string
	FileSize			string
	Uploader			string
	Department			string
	UploadTime 			string
}

type FileQueryReply struct {
	FileMetaDatas 	[]FileMetaDataForQueryUse
}

func BuildFileMetaDataForQueryUse(fileMetaData *FileMetaData) FileMetaDataForQueryUse {
	fileMetaDataForQueryUse := FileMetaDataForQueryUse{
		FileId 				: fileMetaData.FileId,
		NeedAuthorization	: fileMetaData.NeedAuthorization,
		FileVersion			: fileMetaData.FileVersion,
		FileName			: fileMetaData.FileName,
		FileSize			: fileMetaData.FileSize,
		Uploader			: fileMetaData.Uploader,
		Department			: fileMetaData.Department,
		UploadTime 			: fileMetaData.UploadTime,
	}
	return fileMetaDataForQueryUse
}
