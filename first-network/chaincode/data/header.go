package main

import "strings"

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
	return strings.Join([]string{t.Patient, t.Doctor, t.Hospital, t.PatientTime}, "!!")
}

func (t *RegisterArgs) GetHospitalSigContent() string {
	return strings.Join([]string{t.Patient, t.Doctor, t.Hospital, t.PatientTime, t.HospitalTime}, "!!")
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
	return strings.Join([]string{t.Patient, t.Doctor, t.Hospital, t.PatientTime}, "!!")
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
	return strings.Join([]string{t.Doctor, t.Hospital, t.Patient, t.TargetHospital, t.RecordId, t.RequestTime}, "!!")
}

type NewRecordArgs struct {
	Hospital		string
	Doctor			string
	Patient			string
	// RecordId		string
	Inspection		string
	HospitalTime	string
	HospitalSig		string
	HospitalPKC		string
}

func (t *NewRecordArgs) GetHospitalSigContent() string {
	return strings.Join([]string{t.Hospital, t.Doctor, t.Patient, t.Inspection, t.HospitalTime}, "!!")
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
	Begin			string
	End 			string
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
