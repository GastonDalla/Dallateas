
import * as process from 'node:process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))

import * as runtime from "@prisma/client/runtime/client"
import * as $Enums from "./enums"
import * as $Class from "./internal/class"
import * as Prisma from "./internal/prismaNamespace"

export * as $Enums from './enums'
export * from "./enums"

export const PrismaClient = $Class.getPrismaClientClass()
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>
export { Prisma }

export type User = Prisma.UserModel
export type Session = Prisma.SessionModel
export type Account = Prisma.AccountModel
export type Verification = Prisma.VerificationModel
export type DjProfile = Prisma.DjProfileModel
export type DjGig = Prisma.DjGigModel
export type Vinyl = Prisma.VinylModel
export type Tag = Prisma.TagModel

export type VinylTag = Prisma.VinylTagModel

export type VinylTrack = Prisma.VinylTrackModel
export type Folder = Prisma.FolderModel
export type FolderCollaborator = Prisma.FolderCollaboratorModel
export type FolderVinyl = Prisma.FolderVinylModel