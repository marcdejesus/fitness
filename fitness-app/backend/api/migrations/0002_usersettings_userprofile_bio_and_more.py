# Generated by Django 5.1.7 on 2025-03-14 02:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.CharField(max_length=255, unique=True)),
                ('measurement_system', models.CharField(choices=[('metric', 'Metric'), ('imperial', 'Imperial')], default='metric', max_length=10)),
                ('primary_goal', models.CharField(choices=[('strength', 'Strength'), ('weight_loss', 'Weight Loss'), ('muscle_gain', 'Muscle Gain'), ('endurance', 'Endurance')], default='strength', max_length=20)),
                ('workout_days_per_week', models.IntegerField(default=3)),
                ('notification_workouts', models.BooleanField(default=True)),
                ('notification_nutrition', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddField(
            model_name='userprofile',
            name='bio',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='fitness_level',
            field=models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='beginner', max_length=20),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='height',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='weight',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
