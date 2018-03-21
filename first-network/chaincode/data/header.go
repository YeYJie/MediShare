package main


type RegisterArgs struct {
	Patient			string
	Doctor			string
	Hospital		string
	PatientTime		string
	PatientSig		string
	PatientPKC		string
	HospitalTime	string
	HospitalSig		string
	HospitalPKC		string
}

func (t *RegisterArgs) GetPatientSigContent() string {
	return ""
}

func (t *RegisterArgs) GetHospitalSigContent() string {
	return ""
}

type DeRegisterArgs struct {
	Patient			string
	Doctor			string
	Hospital		string
	PatientTime		string
	PatientSig		string
	PatientPKC		string
}

func (t *DeRegisterArgs) GetPatientSigContent() string {
	return ""
}

type RequestDetailArgs struct {
	Doctor			string
	Hospital		string
	Patient			string
	TargetHospital	string
	RecordId		string
	DoctorProf		string
	HospitalPKC		string
	RequestTime		string
	DoctorSig		string
	DoctorPKC		string
}

func (t *RequestDetailArgs) GetDoctorProfContent() string {
	return ""
}

func (t *RequestDetailArgs) GetDoctorSigContent() string {
	return ""
}

type NewRecordArgs struct {
	Hospital		string
	Doctor			string
	Patient			string
	RecordId		string
	Inspection		string
	HospitalTime	string
	HospitalSig		string
	HospitalPKC		string
}

func (t *NewRecordArgs) GetHospitalSigContent() string {
	return ""
}

type GetPatientRecordsArgs struct {
	Doctor			string
	Hospital		string
	Patient			string
	DoctorProf		string
	HospitalPKC		string
	RequestTime		string
	DoctorSig		string
	DoctorPKC		string
}

func (t *GetPatientRecordsArgs) GetDoctorProfContent() string {
	return ""
}

func (t *GetPatientRecordsArgs) GetDoctorSigContent() string {
	return ""
}

type PatientRecordSummary struct {
	Hospital 		string
	Doctor 			string
	RecordId 		string
	Inspection 		string
	RecordTime 		string
}

type GetPatientRecordsReply struct {
	Records 		[]PatientRecordSummary
}
