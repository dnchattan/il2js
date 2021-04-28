import { Address } from './Address';
import { Il2CppTypeEnum } from './Il2CppTypeEnum';

export interface Il2CppTypeInfo {
  TypeIndex: number;
  Type: Il2CppTypeEnum;
  TypeName: string;
  Namespace?: string;
  IsArray?: boolean;
  IsPrimitive?: boolean;
  IsTemplateArg?: boolean;
  Indirection: number;
  DeclaringType?: Il2CppTypeInfo;
  BaseType?: Il2CppTypeInfo;
  ElementType?: Il2CppTypeInfo;
  TemplateArgumentNames?: string[];
  TypeArguments?: Il2CppTypeInfo[];
  Address?: Address;
}

export function mockIl2CppTypeInfo(
  typeDef: Partial<Il2CppTypeInfo> & Pick<Il2CppTypeInfo, 'TypeName'>
): Il2CppTypeInfo {
  return {
    TypeIndex: Math.random(),
    Type: Il2CppTypeEnum.IL2CPP_TYPE_CLASS,
    Indirection: 1,
    Namespace: '',
    ...typeDef,
  };
}
