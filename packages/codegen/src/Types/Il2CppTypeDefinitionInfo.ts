import { Il2CppFieldInfo } from './Il2CppFieldInfo';
import { Il2CppTypeInfo, mockIl2CppTypeInfo } from './Il2CppTypeInfo';

export interface Il2CppTypeDefinitionInfo {
  IsGenericInstance?: boolean;
  ImageName: string;
  Type: Il2CppTypeInfo;
  Fields?: Il2CppFieldInfo[];
  StaticFields?: Il2CppFieldInfo[];
  NestedTypes?: Il2CppTypeDefinitionInfo[];
}

export function mockIl2CppTypeDefinitionInfo(
  type: Partial<Il2CppTypeInfo> & Pick<Il2CppTypeInfo, 'TypeName'>,
  typeDef?: Partial<Il2CppTypeDefinitionInfo>
): Il2CppTypeDefinitionInfo {
  return {
    Type: mockIl2CppTypeInfo(type),
    ImageName: 'image',
    ...typeDef,
  };
}
