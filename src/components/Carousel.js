// components/HorizontalCarousel.js

import React from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const HorizontalCarousel = ({
  children,
  cardWidth = screenWidth * 0.6,
  cardSpacing = 12,
  style = {},
}) => {
  return (
    <ScrollView
      horizontal
      snapToInterval={cardWidth + cardSpacing}
      snapToAlignment="start"
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        ...style,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <View
          style={{
            width: cardWidth,
            marginRight: index === children.length - 1 ? 0 : cardSpacing,
          }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
};

export default HorizontalCarousel;
