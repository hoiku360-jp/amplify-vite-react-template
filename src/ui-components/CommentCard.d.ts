
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, TextProps, ImageProps } from '@aws-amplify/ui-react';

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

export declare type CommentCardOverridesProps = {
  'MyIcon29766875'?: MyIconProps;
  'Danny liked this'?: PrimitiveOverrideProps<TextProps>;
  'User Liked'?: PrimitiveOverrideProps<FlexProps>;
  'Liked'?: PrimitiveOverrideProps<FlexProps>;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Scott'?: PrimitiveOverrideProps<TextProps>;
  'Frame29766881'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon29766886'?: MyIconProps;
  'Frame29766885'?: PrimitiveOverrideProps<FlexProps>;
  'Frame29766880'?: PrimitiveOverrideProps<FlexProps>;
  '“Lorem ipsum dolor sit amet, consectetur adipiscing elit. ”'?: PrimitiveOverrideProps<TextProps>;
  'Frame29766879'?: PrimitiveOverrideProps<FlexProps>;
  'Body'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon29766890'?: MyIconProps;
  '9929766891'?: PrimitiveOverrideProps<TextProps>;
  'Share29766889'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon29766893'?: MyIconProps;
  '9929766894'?: PrimitiveOverrideProps<TextProps>;
  'Repost'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon29766896'?: MyIconProps;
  '9929766897'?: PrimitiveOverrideProps<TextProps>;
  'Like'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon29766898'?: MyIconProps;
  'Share29766888'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type CommentCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: CommentCardOverridesProps | undefined | null;
}>;

export default function CommentCard(props: CommentCardProps): React.ReactElement;
  