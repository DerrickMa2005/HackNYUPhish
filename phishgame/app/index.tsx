import { TagsList } from '@/components/TagsList';
import { EmailsList } from '@/components/EmailsList';
import { Text, View, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';
import phishingEmails from '@/generated_phishing_emails.json';
import { Audio } from 'expo-av'; // Import Audio from expo-av

function getDifficultyString(difficulty: number): string {
  if (difficulty === 0) return "phishnoob";
  if (difficulty === 1) return "phishdisciple";
  return "phishmaster";
}
export default function HomeScreen() {
  const [difficulty, setDifficulty] = useState(0);
  const [score, setScore] = useState(100);
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [displayedEmails, setDisplayedEmails] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameGenerated, setGameGenerated] = useState(false);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const revealIndex = useRef(0); // Use useRef to persist the index across renders
  const [fontsLoaded] = useFonts({
    'custom-font': require('@/assets/fonts/Game-Of-Squids.otf'),
  });
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  function updateScore(input: number) {
    setScore(prevScore => prevScore - input);
  }
  
  
  async function preGenerateEmails() {
    stopSound(); // Stop the music when pre-generating emails
    setIsPreGenerating(true);
    const diffStr = getDifficultyString(difficulty);
    try {
      let emails = phishingEmails[diffStr] || [];
  
      // Validate email data
      emails = emails.filter(email => (
        email &&
        typeof email === 'object' &&
        email.hasOwnProperty('body') &&
        email.hasOwnProperty('call_to_action') &&
        email.hasOwnProperty('topic') &&
        email.hasOwnProperty('subject') &&
        email.hasOwnProperty('phish_or_not') &&
        email.hasOwnProperty('lives_lost_if_wrong') &&
        email.hasOwnProperty('explanation_if_wrong')
        
      ));
      setGeneratedEmails(emails);
    } catch (error) {
      console.error("Error generating emails:", error);
    } finally {
      setIsPreGenerating(false);
      alert('Emails pregenerated!');
    }
  }

  

  function startGameSequence() {
    stopSound(); // Stop the music when starting the game
    setGameStarted(true);
    setDisplayedEmails([]);
    revealIndex.current = -1; // Reset the index when starting a new game
    const emailsToSend = [...generatedEmails];
    setGameGenerated(false);
    const revealNext = () => {
      if (revealIndex.current < emailsToSend.length - 1) {
        setDisplayedEmails(prev => [...prev, emailsToSend[revealIndex.current]]);
        revealIndex.current++;
        const delay = Math.floor(Math.random() * (500)) + 500; // Reduced delay range
        setTimeout(revealNext, delay);
      } else {
        setGameGenerated(true);
      }
    };
    revealNext();
  }

  const removeEmail = (index: number) => {
    setDisplayedEmails(prevEmails => {
      const newEmails = [...prevEmails];
      newEmails.splice(index, 1);
      return newEmails;
    });
  };

  function handleStartGame() {
    if (generatedEmails.length === 0) {
      preGenerateEmails().then(() => {
        setTimeout(() => {
          startGameSequence();
        }, 500);
      });
    } else {
      startGameSequence();
    }
  }

 const [sound, setSound] = useState<Audio.Sound | null>(null); // Store the sound object
  const [isPlaying, setIsPlaying] = useState(false); // Track if the sound is playing

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/squid_game_music.mp3'), // Replace with your sound file
          {
            shouldPlay: false, // Do not play on load
            isLooping: true,   // Loop forever
            volume: 1.0,        // Set volume to maximum
          },
          (status) => {
            if (status.error) {
              console.error('Error during playback:', status.error);
            }
          }
        );
        setSound(newSound); // Store the sound object
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }

    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync(); // Unload the sound when the component unmounts
      }
    };
  }, []);

  const stopSound = async () => {
    if (sound && isPlaying) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const playSound = async () => {
    if (sound && !isPlaying) {
      try {
        await sound.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#29293D', '#14141F']} style={styles.gradientContainer}>
          <LinearGradient colors={['#9C3F49', '#14141F']} style={styles.header}>
            <Text style={[styles.title, { fontFamily: 'custom-font' }]}>Phishgame</Text>
            <View style={styles.searchBar}>
              <Image
                source={require('@/assets/images/black-search-icon.png')}
                style={[styles.searchIcon, { width: 15, height: 15 }]}
                resizeMode="contain"
              />
              <TextInput style={styles.search} placeholder="Search" />
            </View>
            <Text style={styles.score}>Lives: {score}</Text>
          </LinearGradient>
          
          <View style={styles.body}>
            <View style={styles.sidebar}>
              <Image
                source={require('@/assets/images/Green_Menu_Icon.png')}
                style={styles.searchIcon}
              />
              <TouchableOpacity onPress={playSound}>
                <Image
                  source={require('@/assets/images/noise.png')}
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Image
                source={require('@/assets/images/How-To-Play-Question-Mark.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <Image
                source={require('@/assets/images/about.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.main}>
              <TagsList
                difficulty={difficulty}
                selectIndex={(index: number) => {
                  if (!gameStarted) {
                    setDifficulty(index);
                    setGeneratedEmails([]);
                    setDisplayedEmails([]);
                    setGameStarted(false);
                  }
                }}
              />
              {gameStarted && (<EmailsList emails={displayedEmails} score = {score} 
              updateScore={updateScore} removeEmail={removeEmail} 
              endGame = {setGameStarted} generated = {gameGenerated}/>)}
              {!gameStarted && (
              <View style={styles.startScreen}>
                 <Text style={[styles.mainTitle, { fontFamily: 'custom-font' }]}>Phishgame</Text>
                 <Text style={styles.caption}>A Game Designed to Teach Users How to Detect Phishing Emails...</Text>
                  <TouchableOpacity style={styles.centerButton} onPress={preGenerateEmails}>
                    <Text style={styles.buttonText}>
                      {isPreGenerating ? 'Pre-Generating...' : 'Pre-Generate Emails'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.centerButton} onPress={handleStartGame}>
                    <Text style={styles.buttonText}>Start Game</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    backgroundColor: '#249F9C',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 15,
    borderColor: 'lightgrey',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  title: {
    flex: 0.45,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  mainTitle: {
    flex: 0.45,
    fontSize: 100,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  caption : {
    fontSize: 20,
    marginBottom: 20,
    color: '#EEEEEE',
  },
  searchBar: {
    backgroundColor: '#D3D3D3',
    flex: 0.4,
    flexDirection: 'row',
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    marginRight: 20,
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
  score: {
    flex: 0.4,
    color: 'white',
    textAlign: 'right',
  },
  body: {
    flex: 0.95,
    flexDirection: 'row',
  },
  sidebar: {
    flex: 0.05,
    borderColor: 'black',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  main: {
    flex: 0.95,
    flexDirection: 'column',
  },
  startScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 400,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14141F',
  },
});