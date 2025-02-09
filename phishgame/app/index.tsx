import { TagsList } from '@/components/TagsList';
import { EmailsList } from '@/components/EmailsList';
import { Text, View, StyleSheet, Image, TextInput, TouchableOpacity} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import React from 'react';
import { useState } from 'react';
import { useFonts } from 'expo-font';

export default function HomeScreen() {
  const [difficulty, setDifficulty] = useState(0);
  const [score, setScore] = useState(100); 
  // Load the custom font
  const [fontsLoaded] = useFonts({
    'custom-font': require('@/assets/fonts/Game-Of-Squids.otf'), // Replace with your font file path
  });

  // Show loading message while the font is loading
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#29293D', '#14141F']} // Gradient from dark grey-blue to white for the whole page
          style={styles.gradientContainer} 
        >
           {/* Header with a gradient */}
          <LinearGradient
            colors={['#9C3F49', '#800A63']} // Gradient for the header
            style={styles.header}
          >
             <Text style={[styles.title, { fontFamily: 'custom-font' }]}>Phishgame</Text>
            <View style={styles.searchBar}> 
              <Image
                source={require('@/assets/images/black-search-icon.png')}
                style={[styles.searchIcon, {width: 15, height: 15}]}
                resizeMode="contain"
              />
              <TextInput
                style={styles.search}
                placeholder="Search"
              />
            </View>
          </LinearGradient>
        <View style={styles.body}>
          <View style={styles.sidebar}>
          <Image
                source={require('@/assets/images/Green_Menu_Icon.png')}
                style={[styles.searchIcon, {marginTop: 100 }]}
              />
              <Image
                source={require('@/assets/images/How-To-Play-Question-Mark.png')}
                style={[styles.searchIcon, {marginTop: 200 }]}
                resizeMode="contain"
                />
              <Image
                source={require('@/assets/images/about.png')}
                style={[styles.searchIcon, {marginTop: 200 }]}
                resizeMode="contain"
              />
          </View>
          <View style={styles.main}>
            <TagsList difficulty = {difficulty} selectIndex = {setDifficulty}/>
            <EmailsList emails = {require("../test/phishnoob2.json")} updateScore = {setScore}/>
          </View>
        </View>
        </LinearGradient>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flex: 0.05,
    color: '#249F9C',
    backgroundColor: '#249F9C',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 15,
    borderColor: 'light-grey',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  title: {
    flex: 0.3,
    fontSize: 20,
    fontWeight: 'bold',
    color: "#EEEEEE",
  },
  searchBar: {
    backgroundColor: '#D3D3D3',
    flex: 0.4,
    flexDirection: 'row',
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
  },
  searchIcon: {
    width: 30,
    height: 30,
    marginLeft: 5,
    marginTop: 12,
    marginRight: 5,
  },
  search: {
    width: 450,
    fontSize: 15,
  },
  body: {
    flex: 0.95,
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  sidebar: {
    flex: 0.05,
    backgroundColor: 'transparent', // Inherit gradient from parent
    borderColor: 'black',
    borderRightWidth: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    textAlign: 'center',
  },
  main: {
    flex: 0.95,
    flexDirection: 'column',
  },
});
