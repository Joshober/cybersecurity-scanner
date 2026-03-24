package com.nutrition.config;

import com.nutrition.model.NutritionPlan;
import com.nutrition.repository.NutritionPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private NutritionPlanRepository nutritionPlanRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (nutritionPlanRepository.count() == 0) {
            initializeNutritionPlans();
        }
    }
    
    private void initializeNutritionPlans() {
        // Standard Adult Plan
        NutritionPlan standardPlan = new NutritionPlan();
        standardPlan.setName("Standard Adult Plan");
        standardPlan.setDescription("Standard nutrition plan for adults");
        standardPlan.setAge("A");
        standardPlan.setSex("A");
        standardPlan.setHeight("A");
        standardPlan.setWeight("A");
        standardPlan.setFormulaWritten("Standard formula");
        standardPlan.setFactorName("Metabolism Factor");
        standardPlan.setFactorValue("1.55");
        standardPlan.setDailyCalories("2000");
        standardPlan.setCarbohydratesG("250");
        standardPlan.setProteinsG("100");
        standardPlan.setFatsG("67");
        standardPlan.setHydration("2.5");
        standardPlan.setBoronMg("3");
        standardPlan.setCalciumMg("1000");
        standardPlan.setIronMg("18");
        standardPlan.setSeleniumUg("55");
        standardPlan.setZincMg("11");
        standardPlan.setSodiumMg("2300");
        nutritionPlanRepository.save(standardPlan);
        
        // Young Adult Plan (18-25)
        NutritionPlan youngAdultPlan = new NutritionPlan();
        youngAdultPlan.setName("Young Adult Plan");
        youngAdultPlan.setDescription("Nutrition plan for young adults aged 18-25");
        youngAdultPlan.setAge("18-25");
        youngAdultPlan.setSex("A");
        youngAdultPlan.setHeight("A");
        youngAdultPlan.setWeight("A");
        youngAdultPlan.setFormulaWritten("Young adult formula");
        youngAdultPlan.setFactorName("Metabolism Factor");
        youngAdultPlan.setFactorValue("1.6");
        youngAdultPlan.setDailyCalories("2200");
        youngAdultPlan.setCarbohydratesG("275");
        youngAdultPlan.setProteinsG("110");
        youngAdultPlan.setFatsG("73");
        youngAdultPlan.setHydration("2.7");
        youngAdultPlan.setBoronMg("3.5");
        youngAdultPlan.setCalciumMg("1200");
        youngAdultPlan.setIronMg("20");
        youngAdultPlan.setSeleniumUg("60");
        youngAdultPlan.setZincMg("12");
        youngAdultPlan.setSodiumMg("2400");
        nutritionPlanRepository.save(youngAdultPlan);
        
        // Athlete Plan
        NutritionPlan athletePlan = new NutritionPlan();
        athletePlan.setName("Athlete Plan");
        athletePlan.setDescription("High-performance nutrition plan for athletes");
        athletePlan.setAge("A");
        athletePlan.setSex("A");
        athletePlan.setHeight("A");
        athletePlan.setWeight("A");
        athletePlan.setFormulaWritten("Athlete formula");
        athletePlan.setFactorName("Metabolism Factor");
        athletePlan.setFactorValue("1.8");
        athletePlan.setDailyCalories("2800");
        athletePlan.setCarbohydratesG("350");
        athletePlan.setProteinsG("140");
        athletePlan.setFatsG("93");
        athletePlan.setHydration("3.5");
        athletePlan.setBoronMg("4");
        athletePlan.setCalciumMg("1500");
        athletePlan.setIronMg("25");
        athletePlan.setSeleniumUg("70");
        athletePlan.setZincMg("15");
        athletePlan.setSodiumMg("3000");
        nutritionPlanRepository.save(athletePlan);
        
        // Senior Plan (65+)
        NutritionPlan seniorPlan = new NutritionPlan();
        seniorPlan.setName("Senior Plan");
        seniorPlan.setDescription("Nutrition plan for seniors aged 65 and above");
        seniorPlan.setAge("65+");
        seniorPlan.setSex("A");
        seniorPlan.setHeight("A");
        seniorPlan.setWeight("A");
        seniorPlan.setFormulaWritten("Senior formula");
        seniorPlan.setFactorName("Metabolism Factor");
        seniorPlan.setFactorValue("1.3");
        seniorPlan.setDailyCalories("1800");
        seniorPlan.setCarbohydratesG("225");
        seniorPlan.setProteinsG("90");
        seniorPlan.setFatsG("60");
        seniorPlan.setHydration("2.2");
        seniorPlan.setBoronMg("2.5");
        seniorPlan.setCalciumMg("1200");
        seniorPlan.setIronMg("15");
        seniorPlan.setSeleniumUg("50");
        seniorPlan.setZincMg("10");
        seniorPlan.setSodiumMg("2000");
        nutritionPlanRepository.save(seniorPlan);
        
        // Female Specific Plan
        NutritionPlan femalePlan = new NutritionPlan();
        femalePlan.setName("Female Plan");
        femalePlan.setDescription("Nutrition plan specifically designed for females");
        femalePlan.setAge("A");
        femalePlan.setSex("F");
        femalePlan.setHeight("A");
        femalePlan.setWeight("A");
        femalePlan.setFormulaWritten("Female formula");
        femalePlan.setFactorName("Metabolism Factor");
        femalePlan.setFactorValue("1.5");
        femalePlan.setDailyCalories("1900");
        femalePlan.setCarbohydratesG("238");
        femalePlan.setProteinsG("95");
        femalePlan.setFatsG("63");
        femalePlan.setHydration("2.3");
        femalePlan.setBoronMg("3");
        femalePlan.setCalciumMg("1200");
        femalePlan.setIronMg("18");
        femalePlan.setSeleniumUg("55");
        femalePlan.setZincMg("8");
        femalePlan.setSodiumMg("2300");
        nutritionPlanRepository.save(femalePlan);
        
        // Male Specific Plan
        NutritionPlan malePlan = new NutritionPlan();
        malePlan.setName("Male Plan");
        malePlan.setDescription("Nutrition plan specifically designed for males");
        malePlan.setAge("A");
        malePlan.setSex("M");
        malePlan.setHeight("A");
        malePlan.setWeight("A");
        malePlan.setFormulaWritten("Male formula");
        malePlan.setFactorName("Metabolism Factor");
        malePlan.setFactorValue("1.6");
        malePlan.setDailyCalories("2100");
        malePlan.setCarbohydratesG("263");
        malePlan.setProteinsG("105");
        malePlan.setFatsG("70");
        malePlan.setHydration("2.6");
        malePlan.setBoronMg("3");
        malePlan.setCalciumMg("1000");
        malePlan.setIronMg("18");
        malePlan.setSeleniumUg("55");
        malePlan.setZincMg("11");
        malePlan.setSodiumMg("2300");
        nutritionPlanRepository.save(malePlan);
    }
}
