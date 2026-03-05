
import * as React from 'react';

import { FlexProps, TextProps, TextFieldProps, ButtonProps, ImageProps, DividerProps } from '@aws-amplify/ui-react';

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

export declare type CheckoutPaymentOverridesProps = {
  'Payment information'?: PrimitiveOverrideProps<TextProps>;
  'Frame 406'?: PrimitiveOverrideProps<FlexProps>;
  'TextField39343313'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField39343315'?: PrimitiveOverrideProps<TextFieldProps>;
  'TextField39343316'?: PrimitiveOverrideProps<TextFieldProps>;
  'Frame 425'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 409'?: PrimitiveOverrideProps<FlexProps>;
  'TextField39343319'?: PrimitiveOverrideProps<TextFieldProps>;
  'Frame 410'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Frame 41139343321'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 313'?: PrimitiveOverrideProps<FlexProps>;
  'Your order'?: PrimitiveOverrideProps<TextProps>;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Subtotal'?: PrimitiveOverrideProps<TextProps>;
  '$320.00'?: PrimitiveOverrideProps<TextProps>;
  'Frame 316'?: PrimitiveOverrideProps<FlexProps>;
  'Shipping'?: PrimitiveOverrideProps<TextProps>;
  '$15.00'?: PrimitiveOverrideProps<TextProps>;
  'Frame 317'?: PrimitiveOverrideProps<FlexProps>;
  'Taxes'?: PrimitiveOverrideProps<TextProps>;
  '$26.80'?: PrimitiveOverrideProps<TextProps>;
  'Frame 318'?: PrimitiveOverrideProps<FlexProps>;
  'Divider'?: PrimitiveOverrideProps<DividerProps>;
  'Total'?: PrimitiveOverrideProps<TextProps>;
  '$361.80'?: PrimitiveOverrideProps<TextProps>;
  'Frame 319'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 427'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 41139343305'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type CheckoutPaymentProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: CheckoutPaymentOverridesProps | undefined | null;
}>;

export default function CheckoutPayment(props: CheckoutPaymentProps): React.ReactElement;
  