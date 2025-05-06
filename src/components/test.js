import React from 'react';
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';

const CardBg = { uri: 'https://via.placeholder.com/400x300.png?text=Background' }; // placeholder image

export default function GreenhouseCardTest() {
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={styles.container}>
      <Pressable
        className="rounded-3xl overflow-hidden shadow-md"
        style={[styles.card, { height: screenHeight * 0.6 }]}
      >
        <ImageBackground
          source={CardBg}
          resizeMode="cover"
          style={{ flex: 1 }}
          imageStyle={{ borderRadius: 30 }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Test Greenhouse</Text>
            <Text style={styles.subtitle}>Connected</Text>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {Array.from({ length: 15 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.item,
                    { backgroundColor: i % 2 === 0 ? '#10B981' : '#3B82F6' },
                  ]}
                >
                  <Text style={styles.itemText}>Item {i + 1}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    width: 350,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  item: {
    height: 100,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: 'white',
    fontSize: 18,
  },
});
