
import * as React from 'react';

import { FlexProps, TextProps, TextFieldProps, SelectFieldProps, PhoneNumberFieldProps, ButtonProps, ImageProps } from '@aws-amplify/ui-react';

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

export declare type FormCheckoutOverridesProps = {
  'Shipping information'?: PrimitiveOverrideProps<TextProps>;
  'TextField29767009'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField29767010'?: PrimitiveOverrideProps<TextFieldProps>;
  'Frame 426'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 406'?: PrimitiveOverrideProps<FlexProps>;
  'TextField29767014'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField29767015'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField39343126'?: PrimitiveOverrideProps<TextFieldProps>;
  'SelectField'?: PrimitiveOverrideProps<SelectFieldProps>;
  'Frame 425'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 409'?: PrimitiveOverrideProps<FlexProps>;
  'TextField39343134'?: PrimitiveOverrideProps<TextFieldProps>;
  'PhoneNumberField'?: PrimitiveOverrideProps<PhoneNumberFieldProps>;
  'Frame 410'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Frame 41139343187'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 313'?: PrimitiveOverrideProps<FlexProps>;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Frame 41129767005'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type FormCheckoutProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: FormCheckoutOverridesProps | undefined | null;
}>;

export default function FormCheckout(props: FormCheckoutProps): React.ReactElement;
  