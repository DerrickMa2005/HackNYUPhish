import { Text, View, StyleSheet, Image,  TouchableOpacity} from 'react-native';
import React from 'react';

interface TagsProps {
  difficulty: number;
  isSelected: boolean;
  onPress: () => void;
}
const Tag = ({difficulty, isSelected, onPress} : TagsProps) => {
  const imageUrls = [require('@/assets/images/PhishNoob.png'), 
    require('@/assets/images/Phishmediate.png'), 
    require('@/assets/images/PhishMaster.png'),
  require('@/assets/images/PhishNoobSelect.png'),
  require('@/assets/images/PhishMediateSelecter.png'),
  require('@/assets/images/PhishMasterSelect.png')];

  const getTextColor = () => {
    return { color: isSelected  ? '#b85675' :  'white' }; // Default color for others
  };

  return (
    <TouchableOpacity onPress={onPress} style={isSelected ? styles.selectedTagBox : styles.tagBox}>
      <Image 
      source = {imageUrls[difficulty + (isSelected ? 3 : 0)]}
      style={styles.Icon}
      />
      <Text style = {[getTextColor(), styles.tagText]}>{difficulty === 0 ? 'Phish Noob' : difficulty=== 1 ? 'Phish Disciple' : 'Phish Master'} </Text>
    </TouchableOpacity>
  );
}
interface TagListProps {
  difficulty: number;
  selectIndex: (input : number) => void;
}

export function TagsList({difficulty, selectIndex} : TagListProps) {
    return (
    <View style={styles.tags}>
      {[...Array(3)].map((_, index) => (
        <Tag
          key={index}
          difficulty={index}
          isSelected={index === difficulty} 
          onPress={() => selectIndex(index)} 
        />
      ))}
    </View>
    );
}

const styles = StyleSheet.create({
    tags: {
        flex: 0.1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderColor: 'black',
      },
      tagBox: {
        flex: 1/3,
        padding: 10,
        borderColor: 'black',
        borderRightWidth: 1,
        flexDirection: 'row',
      },
      selectedTagBox: {
        flex: 1/3,
        padding: 10,
        borderColor: 'black',
        borderRightWidth: 1,
        backgroundColor: 'light-grey',
        flexDirection: 'row',
      },
      Icon: {
        width: 25,
        height: 25,
        marginLeft: 5,
        marginRight: 10,
      },
      tagText: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    });