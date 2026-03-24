package com.nutrition.repository;

import com.nutrition.model.User;
import com.nutrition.model.UserMeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserMealsRepository extends JpaRepository<UserMeal, Long> {
    List<UserMeal> findByUser(User user);
    // Note: UserMeal uses LocalDateTime mealDate, so we need to query by date range
    List<UserMeal> findByUserAndMealDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    Optional<UserMeal> findByUserAndId(User user, Long id);
    // Helper method to find by user and date (converting LocalDate to LocalDateTime range)
    default List<UserMeal> findByUserAndDate(User user, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return findByUserAndMealDateBetween(user, startOfDay, endOfDay);
    }
    default Optional<UserMeal> findByUserAndDateAndId(User user, LocalDate date, Long id) {
        return findByUserAndId(user, id).filter(meal -> {
            LocalDate mealDate = meal.getMealDate().toLocalDate();
            return mealDate.equals(date);
        });
    }
    default List<UserMeal> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return findByUserAndMealDateBetween(user, start, end);
    }
}
