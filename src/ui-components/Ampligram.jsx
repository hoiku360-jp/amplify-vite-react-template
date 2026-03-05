import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Icon } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function Ampligram(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="8px"
    direction="column"
    width="640px"
    justifyContent="center"
    alignItems="flex-start"
    position="relative"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "Ampligram")}
    {...rest}
  >
    <Flex
      gap="16px"
      direction="row"
      justifyContent="center"
      alignItems="center"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      padding="16px 16px 16px 16px"
      {...getOverrideProps(overrides, "Header")}
    >
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        {...getOverrideProps(overrides, "Profile")}
      >
        <Image
          width="65px"
          height="65px"
          display="block"
          shrink="0"
          position="relative"
          borderRadius="160px"
          objectFit="cover"
          alt=""
          {...getOverrideProps(overrides, "image29766764")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Rene Brandel")}
        >
          Rene Brandel
        </Text>
      </Flex>
      <Flex
        gap="10px"
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Overflow")}
      >
        <Flex
          width="24px"
          height="24px"
          overflow="hidden"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Icon29766767")}
        >
          <Icon
            width="4px"
            height="16px"
            viewBox={{"minX":0,"minY":0,"width":4,"height":16}}
            paths={[{"d":"M 2 4 C 3.100000023841858 4 4 3.100000023841858 4 2 C 4 0.8999999761581421 3.100000023841858 0 2 0 C 0.8999999761581421 0 0 0.8999999761581421 0 2 C 0 3.100000023841858 0.8999999761581421 4 2 4 Z M 2 6 C 0.8999999761581421 6 0 6.899999976158142 0 8 C 0 9.100000023841858 0.8999999761581421 10 2 10 C 3.100000023841858 10 4 9.100000023841858 4 8 C 4 6.899999976158142 3.100000023841858 6 2 6 Z M 2 12 C 0.8999999761581421 12 0 12.899999976158142 0 14 C 0 15.100000023841858 0.8999999761581421 16 2 16 C 3.100000023841858 16 4 15.100000023841858 4 14 C 4 12.899999976158142 3.100000023841858 12 2 12 Z","fillRule":"nonzero"},{"d":"M2 4 C3.1 4 4 3.1 4 2 C4 0.9 3.1 0 2 0 C0.9 0 0 0.9 0 2 C0 3.1 0.9 4 2 4 Z M2 6 C0.9 6 0 6.9 0 8 C0 9.1 0.9 10 2 10 C3.1 10 4 9.1 4 8 C4 6.9 3.1 6 2 6 Z M2 12 C0.9 12 0 12.9 0 14 C0 15.1 0.9 16 2 16 C3.1 16 4 15.1 4 14 C4 12.9 3.1 12 2 12 Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero"}]}
            display="block"
            position="absolute"
            top="16.67%"
            bottom="16.67%"
            left="41.67%"
            right="41.67%"
            {...getOverrideProps(overrides, "Vector29766768")}
          />
        </Flex>
      </Flex>
    </Flex>
    <Image
      height="408px"
      display="block"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      objectFit="cover"
      alt=""
      {...getOverrideProps(overrides, "image29766769")}
    />
    <Flex
      gap="16px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      padding="16px 16px 16px 16px"
      {...getOverrideProps(overrides, "Options")}
    >
      <Flex
        gap="24px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Share")}
      >
        <MyIcon
          type="favorite_border"
          {...getOverrideProps(overrides, "MyIcon29766772")}
        />
        <MyIcon
          type="chat-bubble-outline"
          {...getOverrideProps(overrides, "MyIcon29766773")}
        />
        <MyIcon
          type="send"
          {...getOverrideProps(overrides, "MyIcon29766774")}
        />
      </Flex>
      <Flex
        gap="10px"
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        {...getOverrideProps(overrides, "Bookmark")}
      >
        <Flex
          width="24px"
          height="24px"
          overflow="hidden"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Icon29766776")}
        >
          <Icon
            width="14px"
            height="18px"
            viewBox={{"minX":0,"minY":0,"width":14,"height":18}}
            paths={[{"d":"M 12 0 L 2 0 C 0.8999999761581421 0 0 0.8999999761581421 0 2 L 0 18 L 7 15 L 14 18 L 14 2 C 14 0.8999999761581421 13.100000023841858 0 12 0 Z M 12 15 L 7 12.819999694824219 L 2 15 L 2 2 L 12 2 L 12 15 Z","fillRule":"nonzero"},{"d":"M12 0 L2 0 C0.9 0 0 0.9 0 2 L0 18 L7 15 L14 18 L14 2 C14 0.9 13.1 0 12 0 Z M12 15 L7 12.82 L2 15 L2 2 L12 2 L12 15 Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero"}]}
            display="block"
            position="absolute"
            top="12.5%"
            bottom="12.5%"
            left="20.83%"
            right="20.83%"
            {...getOverrideProps(overrides, "Vector29766777")}
          />
        </Flex>
      </Flex>
    </Flex>
    <Flex
      gap="8px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Body")}
    >
      <Flex
        gap="8px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        padding="16px 16px 16px 16px"
        {...getOverrideProps(overrides, "Area")}
      >
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="700"
          color="rgba(13,26,38,1)"
          lineHeight="20px"
          textAlign="left"
          display="block"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Firstname Lastname")}
        >
          Firstname Lastname
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(48,64,80,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.”")}
        >
          “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.”
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Timestamp")}
        >
          Timestamp
        </Text>
      </Flex>
    </Flex>
  </Flex>
  )
}
