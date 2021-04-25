import { Il2CppTypeEnum, Il2CppTypeInfo } from '../../../Types';

let typeIndex = 0;
export const BuiltinTypes = {
  Fixed: <Il2CppTypeInfo>{
    Type: Il2CppTypeEnum.IL2CPP_TYPE_VALUETYPE,
    IsPrimitive: true,
    TypeName: 'fixed',
    Indirection: 1,
    TypeIndex: --typeIndex,
  },
  UnknownObject: <Il2CppTypeInfo>{
    Type: Il2CppTypeEnum.IL2CPP_TYPE_CLASS,
    Namespace: 'il2js',
    TypeName: 'UnknownObject',
    Indirection: 2,
    TypeIndex: --typeIndex,
  },
  NativeStruct: {
    Type: Il2CppTypeEnum.IL2CPP_TYPE_CLASS,
    Namespace: 'il2js',
    TypeName: 'NativeStruct',
    Indirection: 2,
    TypeIndex: --typeIndex,
  },
  ManagedArray: (type: Il2CppTypeInfo) =>
    <Il2CppTypeInfo>{
      // TODO: Make this a method that takes the type arguments!
      Type: Il2CppTypeEnum.IL2CPP_TYPE_CLASS,
      Namespace: 'System.Internal',
      TypeName: 'ManagedArray',
      Indirection: 2,
      TypeArguments: [type],
      TypeIndex: --typeIndex,
    },
};
