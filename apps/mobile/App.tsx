import { StyleSheet, Text, View } from 'react-native';
import { emptyFoodValue } from '@fatbook/shared';

export default function App() {
  const fv = emptyFoodValue();
  return (
    <View style={styles.container}>
      <Text>Fatbook — в разработке</Text>
      <Text>КБЖУ: {fv.calories} ккал</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
