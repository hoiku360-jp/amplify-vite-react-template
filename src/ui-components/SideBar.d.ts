
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, TextProps } from '@aws-amplify/ui-react';

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

export declare type SideBarOverridesProps = {
  'MyIcon39493361'?: MyIconProps;
  'icon39493360'?: PrimitiveOverrideProps<FlexProps>;
  'label39493362'?: PrimitiveOverrideProps<TextProps>;
  'Frame 322'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 414'?: PrimitiveOverrideProps<FlexProps>;
  'label39493364'?: PrimitiveOverrideProps<TextProps>;
  'MyIcon39493367'?: MyIconProps;
  'icon39493366'?: PrimitiveOverrideProps<FlexProps>;
  'label39493368'?: PrimitiveOverrideProps<TextProps>;
  'link39493365'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39493371'?: MyIconProps;
  'icon39493370'?: PrimitiveOverrideProps<FlexProps>;
  'label39493372'?: PrimitiveOverrideProps<TextProps>;
  'link39493369'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39493375'?: MyIconProps;
  'icon39493374'?: PrimitiveOverrideProps<FlexProps>;
  'label39493376'?: PrimitiveOverrideProps<TextProps>;
  'link39493373'?: PrimitiveOverrideProps<FlexProps>;
  'Section39493363'?: PrimitiveOverrideProps<FlexProps>;
  'label39493378'?: PrimitiveOverrideProps<TextProps>;
  'MyIcon39493381'?: MyIconProps;
  'icon39493380'?: PrimitiveOverrideProps<FlexProps>;
  'label39493382'?: PrimitiveOverrideProps<TextProps>;
  'link39493379'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39493385'?: MyIconProps;
  'icon39493384'?: PrimitiveOverrideProps<FlexProps>;
  'label39493386'?: PrimitiveOverrideProps<TextProps>;
  'link39493383'?: PrimitiveOverrideProps<FlexProps>;
  'MyIcon39493389'?: MyIconProps;
  'icon39493388'?: PrimitiveOverrideProps<FlexProps>;
  'label39493390'?: PrimitiveOverrideProps<TextProps>;
  'link39493387'?: PrimitiveOverrideProps<FlexProps>;
  'Section39493377'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 32139493356'?: PrimitiveOverrideProps<FlexProps>;
  'Frame 32139493355'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type SideBarProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: SideBarOverridesProps | undefined | null;
}>;

export default function SideBar(props: SideBarProps): React.ReactElement;
  