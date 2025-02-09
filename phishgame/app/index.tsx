import { TagsList } from '@/components/TagsList';
import { EmailsList } from '@/components/EmailsList';
import { Text, View, StyleSheet, Image, TextInput, TouchableOpacity} from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import React from 'react';
import { useState } from 'react';

export default function HomeScreen() {
  const [difficulty, setDifficulty] = useState(0);
  const [score, setScore] = useState(100); 
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Phishgame</Text>
            <View style={styles.searchBar}> 
              <Image
              source={require('@/assets/images/search-icon.png')}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.search}
              placeholder="Search">
                </TextInput>
            </View>
            
        </View>
        <View style={styles.body}>
          <View style={styles.sidebar}>
          <Image
              source={require('@/assets/images/search-icon.png')}
              style={styles.searchIcon}
            />
          </View>
          <View style={styles.main}>
            <TagsList difficulty = {difficulty} selectIndex = {setDifficulty}/>
            <EmailsList emails = {require("../test/phishnoob2.json")} updateScore = {setScore}/>
          </View>
        </View>
        </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 0.05,
    color: 'black',
    backgroundColor: 'white',
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
    width: 15,
    height: 15,
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
    backgroundColor: '#D3D3D3',
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
