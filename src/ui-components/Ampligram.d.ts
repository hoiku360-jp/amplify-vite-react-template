
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, ImageProps, TextProps, IconProps } from '@aws-amplify/ui-react';

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

export declare type AmpligramOverridesProps = {
  'image29766764'?: PrimitiveOverrideProps<ImageProps>;
  'Rene Brandel'?: PrimitiveOverrideProps<TextProps>;
  'Profile'?: PrimitiveOverrideProps<FlexProps>;
  'Vector29766768'?: PrimitiveOverrideProps<IconProps>;
  'Icon29766767'?: PrimitiveOverrideProps<FlexProps>;
  'Overflow'?: PrimitiveOverrideProps<FlexProps>;
  'Header'?: PrimitiveOverrideProps<FlexProps>;
  'image29766769'?: PrimitiveOverrideProps<ImageProps>;
  'MyIcon29766772'?: MyIconProps;
  'MyIcon29766773'?: MyIconProps;
  'MyIcon29766774'?: MyIconProps;
  'Share'?: PrimitiveOverrideProps<FlexProps>;
  'Vector29766777'?: PrimitiveOverrideProps<IconProps>;
  'Icon29766776'?: PrimitiveOverrideProps<FlexProps>;
  'Bookmark'?: PrimitiveOverrideProps<FlexProps>;
  'Options'?: PrimitiveOverrideProps<FlexProps>;
  'Firstname Lastname'?: PrimitiveOverrideProps<TextProps>;
  '“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.”'?: PrimitiveOverrideProps<TextProps>;
  'Timestamp'?: PrimitiveOverrideProps<TextProps>;
  'Area'?: PrimitiveOverrideProps<FlexProps>;
  'Body'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type AmpligramProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: AmpligramOverridesProps | undefined | null;
}>;

export default function Ampligram(props: AmpligramProps): React.ReactElement;
  