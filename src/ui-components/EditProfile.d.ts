
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, TextProps, ImageProps, TextFieldProps, ButtonProps } from '@aws-amplify/ui-react';

export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;

export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};

export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;

export declare type EditProfileOverridesProps = {
  'MyIcon'?: MyIconProps;
  'Edit Profile29766916'?: PrimitiveOverrideProps<TextProps>;
  'Edit Profile29766913'?: PrimitiveOverrideProps<FlexProps>;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Upload New Image'?: PrimitiveOverrideProps<TextProps>;
  'Profile'?: PrimitiveOverrideProps<FlexProps>;
  'TextField29766922'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField29766923'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField29766924'?: PrimitiveOverrideProps<TextFieldProps>;
  'Forms'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Content'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type EditProfileProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: EditProfileOverridesProps | undefined | null;
}>;

export default function EditProfile(props: EditProfileProps): React.ReactElement;
  