
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, ImageProps, TextProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type ProfileCardOverridesProps = {
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Melinda Marcus'?: PrimitiveOverrideProps<TextProps>;
  'Design Engineer at Cloth Studios'?: PrimitiveOverrideProps<TextProps>;
  'Name'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon'?: MyIconProps;
  '99 Followers'?: PrimitiveOverrideProps<TextProps>;
  'Followers'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
} & EscapeHatchProps;

export declare type ProfileCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: ProfileCardOverridesProps | undefined | null;
}>;

export default function ProfileCard(props: ProfileCardProps): React.ReactElement;
  