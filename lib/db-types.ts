import type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

export type PublicSchema = Database['public']
export type TableName = keyof PublicSchema['Tables']

export type DbRow<T extends TableName> = Tables<T>
export type DbInsert<T extends TableName> = TablesInsert<T>
export type DbUpdate<T extends TableName> = TablesUpdate<T>

export type AdminRow = DbRow<'admins'>
export type AlumnoRow = DbRow<'alumnos'>
export type ArbitroRow = DbRow<'arbitros'>
export type ClubRow = DbRow<'clubs'>
export type ClubAdminRow = DbRow<'club_admins'>
export type DocumentoRow = DbRow<'documentos'>
export type NewsRow = DbRow<'news'>
export type PlayerRow = DbRow<'players'>
export type ProfesorRow = DbRow<'profesores'>
export type TeamRow = DbRow<'teams'>
export type TournamentRow = DbRow<'tournaments'>

export type ArbitroInsert = DbInsert<'arbitros'>
export type ClubInsert = DbInsert<'clubs'>
export type DocumentoInsert = DbInsert<'documentos'>
export type NewsInsert = DbInsert<'news'>
export type PlayerInsert = DbInsert<'players'>
export type ProfesorInsert = DbInsert<'profesores'>
export type TeamInsert = DbInsert<'teams'>
export type TournamentInsert = DbInsert<'tournaments'>

export type ArbitroUpdate = DbUpdate<'arbitros'>
export type ClubUpdate = DbUpdate<'clubs'>
export type DocumentoUpdate = DbUpdate<'documentos'>
export type NewsUpdate = DbUpdate<'news'>
export type PlayerUpdate = DbUpdate<'players'>
export type ProfesorUpdate = DbUpdate<'profesores'>
export type TeamUpdate = DbUpdate<'teams'>
export type TournamentUpdate = DbUpdate<'tournaments'>
