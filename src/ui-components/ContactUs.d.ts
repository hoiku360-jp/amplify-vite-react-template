
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, TextFieldProps, TextAreaFieldProps, CheckboxFieldProps, ButtonProps, TextProps } from '@aws-amplify/ui-react';

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

export declare type ContactUsOverridesProps = {
  'TextField29766936'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField29766938'?: PrimitiveOverrideProps<TextFieldProps>;
  'Frame 428'?: PrimitiveOverrideProps<FlexProps>;
  'TextField29766939'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextAreaField'?: PrimitiveOverrideProps<TextAreaFieldProps>;
  'CheckboxField'?: PrimitiveOverrideProps<CheckboxFieldProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'MyIcon39193120'?: MyIconProps;
  'Instagram'?: PrimitiveOverrideProps<TextProps>;
  'Frame 2829766942'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39193123'?: MyIconProps;
  'Twitter'?: PrimitiveOverrideProps<TextProps>;
  'Frame 30'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 2829766941'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type ContactUsProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: ContactUsOverridesProps | undefined | null;
}>;

export default function ContactUs(props: ContactUsProps): React.ReactElement;
  