import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function SideBar(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="10px"
    direction="row"
    width="385px"
    height="762px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    padding="32px 0px 32px 0px"
    {...getOverrideProps(overrides, "SideBar")}
    {...rest}
  >
    <Flex
      gap="32px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      grow="1"
      shrink="1"
      basis="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 32139493355")}
    >
      <Flex
        gap="32px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        grow="1"
        shrink="1"
        basis="0"
        alignSelf="stretch"
        position="relative"
        padding="0px 32px 0px 32px"
        {...getOverrideProps(overrides, "Frame 32139493356")}
      >
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 414")}
        >
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Frame 322")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493360")}
            >
              <MyIcon
                type="home"
                {...getOverrideProps(overrides, "MyIcon39493361")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493362")}
            >
              Home
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Section39493363")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "label39493364")}
          >
            Manage
          </Text>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493365")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493366")}
            >
              <MyIcon
                type="content"
                {...getOverrideProps(overrides, "MyIcon39493367")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493368")}
            >
              Content
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493369")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493370")}
            >
              <MyIcon
                type="group"
                {...getOverrideProps(overrides, "MyIcon39493371")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              width="100px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493372")}
            >
              Users
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493373")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493374")}
            >
              <MyIcon
                type="file"
                {...getOverrideProps(overrides, "MyIcon39493375")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493376")}
            >
              Files
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Section39493377")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "label39493378")}
          >
            Set up
          </Text>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493379")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493380")}
            >
              <MyIcon
                type="data"
                {...getOverrideProps(overrides, "MyIcon39493381")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493382")}
            >
              Data
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493383")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493384")}
            >
              <MyIcon
                type="storage"
                {...getOverrideProps(overrides, "MyIcon39493385")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              width="100px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493386")}
            >
              Storage
            </Text>
          </Flex>
          <Flex
            gap="8px"
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "link39493387")}
          >
            <Flex
              gap="0"
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              shrink="0"
              position="relative"
              borderRadius="4px"
              padding="6px 6px 6px 6px"
              backgroundColor="rgba(233,249,252,1)"
              {...getOverrideProps(overrides, "icon39493388")}
            >
              <MyIcon
                type="authentication"
                {...getOverrideProps(overrides, "MyIcon39493389")}
              />
            </Flex>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(4,125,149,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "label39493390")}
            >
              Authentication
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  </Flex>
  )
}
