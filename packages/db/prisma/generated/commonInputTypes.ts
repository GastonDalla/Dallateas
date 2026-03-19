
import type * as runtime from "@prisma/client/runtime/client"
import * as $Enums from "./enums"
import type * as Prisma from "./internal/prismaNamespace"

export type StringFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel>
  in?: string[]
  notIn?: string[]
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringFilter<$PrismaModel> | string
}

export type BoolFilter<$PrismaModel = never> = {
  equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>
  not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean
}

export type StringNullableFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null
  in?: string[] | null
  notIn?: string[] | null
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null
}

export type DateTimeFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  in?: Date[] | string[]
  notIn?: Date[] | string[]
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string
}

export type DateTimeNullableFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null
  in?: Date[] | string[] | null
  notIn?: Date[] | string[] | null
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
}

export type SortOrderInput = {
  sort: Prisma.SortOrder
  nulls?: Prisma.NullsOrder
}

export type StringWithAggregatesFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel>
  in?: string[]
  notIn?: string[]
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedStringFilter<$PrismaModel>
  _max?: Prisma.NestedStringFilter<$PrismaModel>
}

export type BoolWithAggregatesFilter<$PrismaModel = never> = {
  equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>
  not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedBoolFilter<$PrismaModel>
  _max?: Prisma.NestedBoolFilter<$PrismaModel>
}

export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null
  in?: string[] | null
  notIn?: string[] | null
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedStringNullableFilter<$PrismaModel>
  _max?: Prisma.NestedStringNullableFilter<$PrismaModel>
}

export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  in?: Date[] | string[]
  notIn?: Date[] | string[]
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedDateTimeFilter<$PrismaModel>
  _max?: Prisma.NestedDateTimeFilter<$PrismaModel>
}

export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null
  in?: Date[] | string[] | null
  notIn?: Date[] | string[] | null
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>
  _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>
}

export type IntFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel>
  in?: number[]
  notIn?: number[]
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntFilter<$PrismaModel> | number
}

export type IntWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel>
  in?: number[]
  notIn?: number[]
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatFilter<$PrismaModel>
  _sum?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedIntFilter<$PrismaModel>
  _max?: Prisma.NestedIntFilter<$PrismaModel>
}

export type IntNullableFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null
}

export type FloatNullableFilter<$PrismaModel = never> = {
  equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null
}

export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _max?: Prisma.NestedIntNullableFilter<$PrismaModel>
}

export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  not?: Prisma.NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _sum?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _min?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _max?: Prisma.NestedFloatNullableFilter<$PrismaModel>
}

export type EnumFolderTypeFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderType | Prisma.EnumFolderTypeFieldRefInput<$PrismaModel>
  in?: $Enums.FolderType[]
  notIn?: $Enums.FolderType[]
  not?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel> | $Enums.FolderType
}

export type EnumFolderVisibilityFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderVisibility | Prisma.EnumFolderVisibilityFieldRefInput<$PrismaModel>
  in?: $Enums.FolderVisibility[]
  notIn?: $Enums.FolderVisibility[]
  not?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel> | $Enums.FolderVisibility
}

export type EnumFolderTypeWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderType | Prisma.EnumFolderTypeFieldRefInput<$PrismaModel>
  in?: $Enums.FolderType[]
  notIn?: $Enums.FolderType[]
  not?: Prisma.NestedEnumFolderTypeWithAggregatesFilter<$PrismaModel> | $Enums.FolderType
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel>
  _max?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel>
}

export type EnumFolderVisibilityWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderVisibility | Prisma.EnumFolderVisibilityFieldRefInput<$PrismaModel>
  in?: $Enums.FolderVisibility[]
  notIn?: $Enums.FolderVisibility[]
  not?: Prisma.NestedEnumFolderVisibilityWithAggregatesFilter<$PrismaModel> | $Enums.FolderVisibility
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel>
  _max?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel>
}

export type EnumCollaboratorRoleFilter<$PrismaModel = never> = {
  equals?: $Enums.CollaboratorRole | Prisma.EnumCollaboratorRoleFieldRefInput<$PrismaModel>
  in?: $Enums.CollaboratorRole[]
  notIn?: $Enums.CollaboratorRole[]
  not?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel> | $Enums.CollaboratorRole
}

export type EnumCollaboratorRoleWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.CollaboratorRole | Prisma.EnumCollaboratorRoleFieldRefInput<$PrismaModel>
  in?: $Enums.CollaboratorRole[]
  notIn?: $Enums.CollaboratorRole[]
  not?: Prisma.NestedEnumCollaboratorRoleWithAggregatesFilter<$PrismaModel> | $Enums.CollaboratorRole
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel>
  _max?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel>
}

export type NestedStringFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel>
  in?: string[]
  notIn?: string[]
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringFilter<$PrismaModel> | string
}

export type NestedBoolFilter<$PrismaModel = never> = {
  equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>
  not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean
}

export type NestedStringNullableFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null
  in?: string[] | null
  notIn?: string[] | null
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null
}

export type NestedDateTimeFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  in?: Date[] | string[]
  notIn?: Date[] | string[]
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string
}

export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null
  in?: Date[] | string[] | null
  notIn?: Date[] | string[] | null
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
}

export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel>
  in?: string[]
  notIn?: string[]
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedStringFilter<$PrismaModel>
  _max?: Prisma.NestedStringFilter<$PrismaModel>
}

export type NestedIntFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel>
  in?: number[]
  notIn?: number[]
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntFilter<$PrismaModel> | number
}

export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
  equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>
  not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedBoolFilter<$PrismaModel>
  _max?: Prisma.NestedBoolFilter<$PrismaModel>
}

export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null
  in?: string[] | null
  notIn?: string[] | null
  lt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  lte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gt?: string | Prisma.StringFieldRefInput<$PrismaModel>
  gte?: string | Prisma.StringFieldRefInput<$PrismaModel>
  contains?: string | Prisma.StringFieldRefInput<$PrismaModel>
  startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>
  not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedStringNullableFilter<$PrismaModel>
  _max?: Prisma.NestedStringNullableFilter<$PrismaModel>
}

export type NestedIntNullableFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null
}

export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  in?: Date[] | string[]
  notIn?: Date[] | string[]
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedDateTimeFilter<$PrismaModel>
  _max?: Prisma.NestedDateTimeFilter<$PrismaModel>
}

export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null
  in?: Date[] | string[] | null
  notIn?: Date[] | string[] | null
  lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>
  not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>
  _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>
}

export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel>
  in?: number[]
  notIn?: number[]
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatFilter<$PrismaModel>
  _sum?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedIntFilter<$PrismaModel>
  _max?: Prisma.NestedIntFilter<$PrismaModel>
}

export type NestedFloatFilter<$PrismaModel = never> = {
  equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  in?: number[]
  notIn?: number[]
  lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  not?: Prisma.NestedFloatFilter<$PrismaModel> | number
}

export type NestedFloatNullableFilter<$PrismaModel = never> = {
  equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null
}

export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  lte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gt?: number | Prisma.IntFieldRefInput<$PrismaModel>
  gte?: number | Prisma.IntFieldRefInput<$PrismaModel>
  not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _min?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _max?: Prisma.NestedIntNullableFilter<$PrismaModel>
}

export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
  equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>
  not?: Prisma.NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
  _count?: Prisma.NestedIntNullableFilter<$PrismaModel>
  _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _sum?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _min?: Prisma.NestedFloatNullableFilter<$PrismaModel>
  _max?: Prisma.NestedFloatNullableFilter<$PrismaModel>
}

export type NestedEnumFolderTypeFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderType | Prisma.EnumFolderTypeFieldRefInput<$PrismaModel>
  in?: $Enums.FolderType[]
  notIn?: $Enums.FolderType[]
  not?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel> | $Enums.FolderType
}

export type NestedEnumFolderVisibilityFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderVisibility | Prisma.EnumFolderVisibilityFieldRefInput<$PrismaModel>
  in?: $Enums.FolderVisibility[]
  notIn?: $Enums.FolderVisibility[]
  not?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel> | $Enums.FolderVisibility
}

export type NestedEnumFolderTypeWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderType | Prisma.EnumFolderTypeFieldRefInput<$PrismaModel>
  in?: $Enums.FolderType[]
  notIn?: $Enums.FolderType[]
  not?: Prisma.NestedEnumFolderTypeWithAggregatesFilter<$PrismaModel> | $Enums.FolderType
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel>
  _max?: Prisma.NestedEnumFolderTypeFilter<$PrismaModel>
}

export type NestedEnumFolderVisibilityWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.FolderVisibility | Prisma.EnumFolderVisibilityFieldRefInput<$PrismaModel>
  in?: $Enums.FolderVisibility[]
  notIn?: $Enums.FolderVisibility[]
  not?: Prisma.NestedEnumFolderVisibilityWithAggregatesFilter<$PrismaModel> | $Enums.FolderVisibility
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel>
  _max?: Prisma.NestedEnumFolderVisibilityFilter<$PrismaModel>
}

export type NestedEnumCollaboratorRoleFilter<$PrismaModel = never> = {
  equals?: $Enums.CollaboratorRole | Prisma.EnumCollaboratorRoleFieldRefInput<$PrismaModel>
  in?: $Enums.CollaboratorRole[]
  notIn?: $Enums.CollaboratorRole[]
  not?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel> | $Enums.CollaboratorRole
}

export type NestedEnumCollaboratorRoleWithAggregatesFilter<$PrismaModel = never> = {
  equals?: $Enums.CollaboratorRole | Prisma.EnumCollaboratorRoleFieldRefInput<$PrismaModel>
  in?: $Enums.CollaboratorRole[]
  notIn?: $Enums.CollaboratorRole[]
  not?: Prisma.NestedEnumCollaboratorRoleWithAggregatesFilter<$PrismaModel> | $Enums.CollaboratorRole
  _count?: Prisma.NestedIntFilter<$PrismaModel>
  _min?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel>
  _max?: Prisma.NestedEnumCollaboratorRoleFilter<$PrismaModel>
}

