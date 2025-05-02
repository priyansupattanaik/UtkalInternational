import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useFavorite} from '../../src/utils/FavoriteContext';
import {useTheme} from '../utils/ThemeContext';

export default function CategoryScreen({route}: any) {
  const {categories} = route.params;
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const {favorites, toggleFavorite} = useFavorite();
  const {isWhiteMode} = useTheme();

  const filteredCategories = categories.filter(
    (item: any) =>
      item.title.toLowerCase().startsWith(searchTerm.toLowerCase()) &&
      (selectedWeight ? item.weight === selectedWeight : true),
  );

  const renderCategoryItem = ({item}: any) => {
    const isFavorite = favorites.some((fav: any) => fav.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.categoryCard, isWhiteMode && styles.categoryCardDark]}
        onPress={() => navigation.navigate('ProductInfo', {product: item})}>
        <Image source={item.image} style={styles.categoryImage} />
        <Text style={styles.categoryTitle}>{item.title}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <Image
              source={require('../assets/images/pageicons/fi-br-heart.png')}
              style={[
                styles.iconImage,
                isFavorite && styles.iconImageFavorite, // Highlight heart icon if favorite
              ]}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={
        isWhiteMode ? null : require('../assets/images/backgrounds/bg1.png')
      }
      style={[styles.container, isWhiteMode && styles.containerDark]}
      resizeMode="cover">
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, isWhiteMode && styles.greetingDark]}>
            Hi Shiva 👋
          </Text>
          <Text
            style={[styles.subGreeting, isWhiteMode && styles.subGreetingDark]}>
            Discover products that suit your needs
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          isWhiteMode && styles.searchContainerDark,
        ]}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}>
        <TouchableOpacity
          key="all"
          style={[
            styles.categoryButton,
            !selectedWeight && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedWeight('')}>
          <Text
            style={[
              styles.categoryText,
              !selectedWeight && styles.selectedCategoryText,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        {['500g', '1kg'].map(weight => (
          <TouchableOpacity
            key={weight}
            style={[
              styles.categoryButton,
              selectedWeight === weight && styles.selectedCategoryButton,
            ]}
            onPress={() =>
              setSelectedWeight(weight === selectedWeight ? '' : weight)
            }>
            <Text
              style={[
                styles.categoryText,
                selectedWeight === weight && styles.selectedCategoryText,
              ]}>
              {weight}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoryList}
        showsVerticalScrollIndicator={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  containerDark: {backgroundColor: '#FFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  greetingContainer: {flex: 1},
  greeting: {fontSize: 22, fontWeight: 'bold', color: 'white'},
  greetingDark: {color: '#333'},
  subGreeting: {fontSize: 14, color: 'white', marginTop: 4},
  subGreetingDark: {color: '#555'},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  searchContainerDark: {backgroundColor: '#ddd'},
  searchInput: {fontSize: 16, color: '#333'},
  filterButton: {
    padding: 10,
  },
  filterText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  categoryButton: {
    padding: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },

  selectedCategoryButton: {
    backgroundColor: '#FF3B30',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  categoryTextDark: {
    color: '#555',
  },
  categoryList: {
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 10,
    flex: 1,
    height: 240,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryImage: {
    width: 120,
    height: 140,
    resizeMode: 'contain',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 7,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rating: {fontSize: 14, color: '#333'},
  iconImage: {width: 24, height: 24, tintColor: '#333'},
  iconImageFavorite: {tintColor: '#FF3B30'},
});
