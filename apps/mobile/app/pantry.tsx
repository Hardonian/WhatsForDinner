import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card } from '@whats-for-dinner/ui';
import { usePantryItems, useRemovePantryItem } from '../src/hooks/usePantry';
import { Plus } from 'lucide-react-native';

export default function PantryScreen() {
  const { data: pantryItems = [], isLoading } = usePantryItems();
  const removePantryItem = useRemovePantryItem();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAddItem = () => {
    // Navigate to add item screen or show modal
      };

  const handleRemoveItem = (id: string) => {
    removePantryItem.mutate(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 py-8">
        <View className="flex-row justify-between items-center mb-6">
          <Text variant="h1">My Pantry</Text>
          <Button onPress={handleAddItem} size="sm">
            <Plus size={16} />
          </Button>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading ? (
            <View className="space-y-4">
              <Card className="p-4">
                <Text>Loading pantry items...</Text>
              </Card>
            </View>
          ) : pantryItems.length === 0 ? (
            <Card className="p-8 items-center">
              <Text variant="h3" className="text-center mb-4">
                Your pantry is empty
              </Text>
              <Text variant="body" className="text-center text-muted-foreground mb-6">
                Add some ingredients to get started with recipe suggestions
              </Text>
              <Button onPress={handleAddItem}>
                Add First Item
              </Button>
            </Card>
          ) : (
            <View className="space-y-4">
              {pantryItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text variant="h4">{item.ingredient}</Text>
                      <Text variant="body" className="text-muted-foreground">
                        {item.quantity} {item.unit}
                      </Text>
                      {item.category && (
                        <Text variant="small" className="text-muted-foreground">
                          {item.category}
                        </Text>
                      )}
                    </View>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}