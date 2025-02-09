import { TagsList } from '@/components/TagsList';
import { EmailsList } from '@/components/EmailsList';
import { Text, View, StyleSheet, Image, TextInput, TouchableOpacity, Modal, Linking} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Import useRef and useEffect
import { useFonts } from 'expo-font';
import phishingEmails from '@/generated_phishing_emails(1).json';
import { Audio } from 'expo-av'; // Import Audio from expo-av

function getDifficultyString(difficulty: number): string {
  if (difficulty === 0) return "phishnoob";
  if (difficulty === 1) return "phishdisciple";
  return "phishmaster";
}
export default function HomeScreen() {
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
  const handleLink = useCallback(async () => {
    const supported = await Linking.canOpenURL("https://www.bleepingcomputer.com/tag/phishing/");
    if (supported) {
      await Linking.openURL("https://www.bleepingcomputer.com/tag/phishing/");
    } else {
      console.error('Cannot open URL:', "https://www.bleepingcomputer.com/tag/phishing/");
    }
  }, []);
  const [difficulty, setDifficulty] = useState(0);
  const [score, setScore] = useState(100);
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [displayedEmails, setDisplayedEmails] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameGenerated, setGameGenerated] = useState(false);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null); // Store the sound object
  const [isPlaying, setIsPlaying] = useState(false); // Track if the sound is playing
  const [rulesVisible, setRulesVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const revealIndex = useRef(0); // Use useRef to persist the index across renders
  const [fontsLoaded] = useFonts({
    'custom-font': require('@/assets/fonts/Game-Of-Squids.otf'),
  });
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }
  interface PopProp {
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
  }
  const Pop = ({ isVisible, children, onClose }: PopProp) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => onClose()}
      >
        <View style={styles.outerEmail}>
          <View style={styles.openEmail}>
            <LinearGradient colors={['#9C3F49', '#14141F']} style={styles.container}>
              <Text style={styles.emailMain}>{children}</Text>
              <View style={styles.closeRegion}>
                <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>Click here to close this window.</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    );
  }
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
  function updateScore(input: number) {
    setScore(prevScore => prevScore - input);
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
              <TouchableOpacity onPress={playSound}>
                <Image
                  source={require('@/assets/images/noise.png')}
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={!rulesVisible ? () => setRulesVisible(true) :
                () => setRulesVisible(false)
              }>
              <Image
                source={require('@/assets/images/How-To-Play-Question-Mark.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
          <Pop isVisible={rulesVisible} onClose={() => setRulesVisible(false)}>
          <View style={styles.block}>
                <Text style={styles.padding}>Rules</Text>
                <Text style={styles.padding}>1. Click on the emails to view the full content.</Text>
                <Text style={styles.padding}>2. Identify whether or not the email is a phishing email or not.</Text>
                <Text style={styles.padding}>3. If you incorrectly identify an email, we will take several lives.</Text>
                <Text style={styles.padding}>4. Good Luck...</Text>
                </View>
              </Pop>
              </TouchableOpacity>
              <TouchableOpacity onPress={!statsVisible ? () => setStatsVisible(true) :
                () => setStatsVisible(false)
              }>
              <Image
                source={require('@/assets/images/about.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              </TouchableOpacity>
              <Pop isVisible={statsVisible} onClose={() => setStatsVisible(false)}>
          <View style = {styles.statsBlock}>
          <View style={styles.stats}>
                <Text style={styles.padding}>Statistics</Text>
                <Text style={styles.padding}>-83% of UK businesses suffered a phishing attack in 2022</Text>
                <Text style={styles.padding}>-26% of organizations have a plan for cyber incidents</Text>
                <Text style={styles.padding}>-$4.9 million is the average amount to recover from a phishing attack</Text>
                <Text style={styles.padding}>-A quarter of phishing emails bypassed Office 365 Security in 2019</Text>
                </View>
              <TouchableOpacity style={styles.graph} onPress={handleLink}>
                  <Image
                    source={require('@/assets/images/phishgraph.png')}
                    style={{ width: 400, height: 300 }}
                    resizeMode="contain"
                  />
              </TouchableOpacity>
              </View>
              </Pop>
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
  statsBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stats: {
    flex: 0.6,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  graph: {
    flex: 0.5,
    paddingLeft: 50,
  },
  padding: {
    padding: 10,
    fontSize: 20,
  },
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
  outerEmail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  openEmail: {
    width: '200%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emailMain: {
    flex: 0.2,
    flexDirection: 'column',
    height: 500,
    width: 1000,
    color: 'white',
    fontSize: 13,
    padding: 10,
    margin: 10,
  },
  closeRegion: {
    flex: 0.9,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButton: {
    width: 300,
    height: 75,
    backgroundColor: 'white',
    borderColor: 'black',
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    paddingTop: 20,
    alignItems: 'center',
    textAlign: 'center',
    fontSize: 20,
    color: 'black',
    marginTop: 150,
  },
  block: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});