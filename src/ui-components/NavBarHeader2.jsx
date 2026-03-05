import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Icon, Text, Button } from '@aws-amplify/ui-react';


export default function NavBarHeader2(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="10px"
    direction="row"
    width="1440px"
    justifyContent="space-between"
    alignItems="center"
    overflow="hidden"
    position="relative"
    boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
    padding="16px 32px 16px 32px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "NavBarHeader2")}
    {...rest}
  >
    <Flex
      gap="32px"
      direction="row"
      justifyContent="center"
      alignItems="center"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 5")}
    >
      <Flex
        width="34.55px"
        height="30px"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Amplify Mark")}
      >
        <Icon
          width="34.55px"
          height="30px"
          viewBox={{"minX":0,"minY":0,"width":34.55172348022461,"height":30}}
          paths={[{"d":"M 21.469161047504592 29.759187698364258 C 21.54762410148585 29.89482193440199 21.692629345139355 29.978376388549805 21.849555464277742 29.978376388549805 L 25.26664073459604 29.978376388549805 C 25.60476948752416 29.978376388549805 25.816098074970196 29.613058537244797 25.647033720857877 29.320807456970215 L 13.23462435517106 7.864246845245361 C 13.065559978707002 7.571995764970779 12.64289986456121 7.571995720267296 12.47383552162476 7.864246845245361 C 8.344928893013371 15.001631498336792 4.206189516344328 22.171087503433228 0.05945943198284894 29.34250831604004 C -0.10952889268816299 29.63475937396288 0.10180707641978365 30 0.43989778668757284 30 L 16.444910618017136 30 C 16.783039326241774 30 16.994369366550867 29.6346849873662 16.825305034790286 29.34243392944336 L 15.188159219446295 26.512398719787598 C 15.10969617105297 26.376764483749866 14.964689491300216 26.29321002960205 14.807763372161828 26.29321002960205 L 6.6217560609907755 26.29321002960205 C 6.452691684526717 26.29321002960205 6.347026675548041 26.11055253446102 6.4315588526042005 25.96442699432373 L 12.662547144008972 15.19330358505249 C 12.747079332241 15.0471780449152 12.958410814237277 15.047178022563457 13.042942991293437 15.19330358505249 L 21.469161047504592 29.759187698364258 Z","fillRule":"nonzero"},{"d":"M 15.19235347862678 3.164913296699524 C 15.113890452585196 3.3005474992096424 15.113887569210823 3.467654697597027 15.192350617604147 3.6032888889312744 L 30.323283662338245 29.759187698364258 C 30.40174671073157 29.894821889698505 30.546753424011936 29.978376388549805 30.703679509622713 29.978376388549805 L 34.11182694523444 29.978376388549805 C 34.449955720514296 29.978376388549805 34.6612871913347 29.613061398267746 34.4922227925189 29.320810317993164 L 17.657214599467626 0.21918799728155136 C 17.488150200651827 -0.07306308299303055 17.065490108857773 -0.0730624794960022 16.896425765921325 0.2191886454820633 L 15.19235347862678 3.164913296699524 Z","fillRule":"nonzero"},{"d":"M21.4692 29.7592 C21.5476 29.8948 21.6926 29.9784 21.8496 29.9784 L25.2666 29.9784 C25.6048 29.9784 25.8161 29.6131 25.647 29.3208 L13.2346 7.86425 C13.0656 7.572 12.6429 7.572 12.4738 7.86425 C8.34493 15.0016 4.20619 22.1711 0.0594594 29.3425 C-0.109529 29.6348 0.101807 30 0.439898 30 L16.4449 30 C16.783 30 16.9944 29.6347 16.8253 29.3424 L15.1882 26.5124 C15.1097 26.3768 14.9647 26.2932 14.8078 26.2932 L6.62176 26.2932 C6.45269 26.2932 6.34703 26.1106 6.43156 25.9644 L12.6625 15.1933 C12.7471 15.0472 12.9584 15.0472 13.0429 15.1933 L21.4692 29.7592 Z","fill":"rgba(64,170,191,1)","fillRule":"nonzero"},{"d":"M15.1924 3.16491 C15.1139 3.30055 15.1139 3.46765 15.1924 3.60329 L30.3233 29.7592 C30.4017 29.8948 30.5468 29.9784 30.7037 29.9784 L34.1118 29.9784 C34.45 29.9784 34.6613 29.6131 34.4922 29.3208 L17.6572 0.219188 C17.4882 -0.0730631 17.0655 -0.0730625 16.8964 0.219189 L15.1924 3.16491 Z","fill":"rgba(64,170,191,1)","fillRule":"nonzero"}]}
          display="block"
          position="absolute"
          top="0%"
          bottom="0%"
          left="0%"
          right="0%"
          {...getOverrideProps(overrides, "Union")}
        />
      </Flex>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Home")}
      >
        Home
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Products")}
      >
        Products
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Pricing")}
      >
        Pricing
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Contact")}
      >
        Contact
      </Text>
    </Flex>
    <Flex
      gap="8px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "actions")}
    >
      <Button
        shrink="0"
        size="default"
        isDisabled={false}
        variation="link"
        {...getOverrideProps(overrides, "Button39493466")}
      >
        Log in
      </Button>
      <Button
        shrink="0"
        size="default"
        isDisabled={false}
        variation="primary"
        {...getOverrideProps(overrides, "Button39493467")}
      >
        Sign up
      </Button>
    </Flex>
  </Flex>
  )
}
