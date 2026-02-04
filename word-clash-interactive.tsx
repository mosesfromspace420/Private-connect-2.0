import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { getDailyPuzzle, calculateWordScore } from "@/lib/game-mechanics";

export default function WordClashScreen() {
  const colors = useColors();
  const [gameState, setGameState] = useState<"playing" | "solved" | "failed">("playing");
  const [userGuess, setUserGuess] = useState("");
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const today = new Date().toISOString().split("T")[0];
  const puzzle = getDailyPuzzle(today);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleSubmit = () => {
    const calculatedScore = calculateWordScore(
      puzzle.word,
      userGuess,
      timeSpent * 1000,
      puzzle.difficulty,
    );

    if (calculatedScore > 0) {
      setScore(calculatedScore);
      setGameState("solved");
    } else {
      setGameState("failed");
    }
  };

  const handleNewGame = () => {
    setGameState("playing");
    setUserGuess("");
    setScore(0);
    setTimeSpent(0);
    setStartTime(Date.now());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return colors.success;
      case "medium":
        return colors.warning;
      case "hard":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const maskWord = (word: string, guessLength: number) => {
    return word
      .split("")
      .map((char, i) => (i < guessLength ? char : "_"))
      .join(" ");
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-3xl font-bold text-foreground">Word Clash</Text>
          <View className="flex-row gap-4 mt-3">
            <View>
              <Text className="text-xs text-muted">Today's Puzzle</Text>
              <Text className="text-lg font-bold text-foreground">{today}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Difficulty</Text>
              <Text
                className="text-lg font-bold"
                style={{ color: getDifficultyColor(puzzle.difficulty) }}
              >
                {puzzle.difficulty.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Time</Text>
              <Text className="text-lg font-bold text-foreground">{timeSpent}s</Text>
            </View>
          </View>
        </View>

        {/* Game Content */}
        <View style={{ padding: 16, flex: 1 }}>
          {gameState === "playing" ? (
            <>
              {/* Hint */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs text-muted uppercase tracking-wide mb-2">Hint</Text>
                <Text className="text-xl font-semibold text-foreground">{puzzle.hint}</Text>
              </View>

              {/* Word Display */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text className="text-4xl font-bold text-primary tracking-widest">
                  {maskWord(puzzle.word, userGuess.length)}
                </Text>
                <Text className="text-sm text-muted mt-4">
                  {userGuess.length} / {puzzle.word.length} letters
                </Text>
              </View>

              {/* Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Your Guess</Text>
                <TextInput
                  placeholder="Type the word..."
                  placeholderTextColor={colors.muted}
                  value={userGuess}
                  onChangeText={setUserGuess}
                  autoCapitalize="characters"
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  style={{ color: colors.foreground, fontSize: 16 }}
                  maxLength={puzzle.word.length}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={userGuess.length !== puzzle.word.length}
                style={({ pressed }) => ({
                  backgroundColor:
                    userGuess.length === puzzle.word.length ? colors.primary : colors.border,
                  borderRadius: 8,
                  padding: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  className="text-base font-bold"
                  style={{
                    color:
                      userGuess.length === puzzle.word.length
                        ? colors.background
                        : colors.muted,
                  }}
                >
                  {userGuess.length === puzzle.word.length ? "Submit Answer" : "Keep Typing..."}
                </Text>
              </Pressable>
            </>
          ) : gameState === "solved" ? (
            <>
              {/* Success Screen */}
              <View className="flex-1 items-center justify-center gap-6">
                <Text className="text-6xl">🎉</Text>
                <View className="items-center gap-2">
                  <Text className="text-3xl font-bold text-foreground">Correct!</Text>
                  <Text className="text-lg text-muted">The word was: {puzzle.word}</Text>
                </View>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    width: "100%",
                    borderWidth: 2,
                    borderColor: colors.success,
                  }}
                >
                  <View className="gap-3">
                    <View className="flex-row justify-between">
                      <Text className="text-muted">Base Score:</Text>
                      <Text className="font-bold text-foreground">
                        {puzzle.difficulty === "easy" ? 10 : puzzle.difficulty === "medium" ? 20 : 50}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-muted">Time Bonus:</Text>
                      <Text className="font-bold text-foreground">
                        +{Math.round((score * 0.1) / 5)}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border,
                        marginVertical: 8,
                      }}
                    />
                    <View className="flex-row justify-between">
                      <Text className="font-bold text-foreground">Total Score:</Text>
                      <Text className="text-2xl font-bold text-primary">{score}</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={handleNewGame}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    padding: 16,
                    width: "100%",
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text className="text-base font-bold text-background">Play Tomorrow's Puzzle</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* Failed Screen */}
              <View className="flex-1 items-center justify-center gap-6">
                <Text className="text-6xl">❌</Text>
                <View className="items-center gap-2">
                  <Text className="text-3xl font-bold text-foreground">Not Quite!</Text>
                  <Text className="text-lg text-muted">The word was: {puzzle.word}</Text>
                </View>

                <Pressable
                  onPress={handleNewGame}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    padding: 16,
                    width: "100%",
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text className="text-base font-bold text-background">Try Again Tomorrow</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
